#!/usr/bin/env bash
# =============================================================================
# Nenyax — One-Command Installer
#
# Usage:
#   curl -fsSL https://get.nenyax.dev | sh
#   (or)
#   bash install.sh
#
# Supports: Ubuntu 20+, Debian 11+, CentOS 8+, Fedora 36+, Amazon Linux 2
# =============================================================================

set -euo pipefail

NENYAX_DIR="/opt/nenyax"
REPO_URL="https://github.com/Nenyax-AI/Nenyax.git"
BRANCH="master"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Root check ──────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root. Try: sudo bash install.sh"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         Nenyax Installer             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Detect OS ───────────────────────────────────────────────────────────────
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_ID="$ID"
    elif [ -f /etc/redhat-release ]; then
        OS_ID="centos"
    else
        error "Unsupported operating system. Requires Ubuntu, Debian, CentOS, or Fedora."
    fi
    info "Detected OS: $OS_ID"
}

# ── Install Docker ──────────────────────────────────────────────────────────
install_docker() {
    if command -v docker &>/dev/null; then
        ok "Docker already installed: $(docker --version)"
        return
    fi

    info "Installing Docker..."

    case "$OS_ID" in
        ubuntu|debian)
            apt-get update -qq
            apt-get install -y -qq ca-certificates curl gnupg lsb-release >/dev/null
            install -m 0755 -d /etc/apt/keyrings
            curl -fsSL "https://download.docker.com/linux/$OS_ID/gpg" | \
                gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            chmod a+r /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
                https://download.docker.com/linux/$OS_ID $(lsb_release -cs) stable" \
                > /etc/apt/sources.list.d/docker.list
            apt-get update -qq
            apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin >/dev/null
            ;;
        centos|rhel|rocky|almalinux|amzn)
            yum install -y -q yum-utils >/dev/null
            yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo >/dev/null
            yum install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin >/dev/null
            ;;
        fedora)
            dnf install -y -q dnf-plugins-core >/dev/null
            dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo >/dev/null
            dnf install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin >/dev/null
            ;;
        *)
            error "Unsupported OS for Docker installation: $OS_ID"
            ;;
    esac

    systemctl enable docker
    systemctl start docker
    ok "Docker installed: $(docker --version)"
}

# ── Install git ─────────────────────────────────────────────────────────────
install_git() {
    if command -v git &>/dev/null; then
        return
    fi

    info "Installing git..."
    case "$OS_ID" in
        ubuntu|debian)
            apt-get install -y -qq git >/dev/null
            ;;
        centos|rhel|rocky|almalinux|amzn|fedora)
            yum install -y -q git >/dev/null 2>&1 || dnf install -y -q git >/dev/null
            ;;
    esac
    ok "Git installed"
}

# ── Generate random password ────────────────────────────────────────────────
gen_password() {
    openssl rand -base64 24 | tr -d '/+=' | head -c 24
}

# ── Detect public IP ───────────────────────────────────────────────────────
detect_ip() {
    PUBLIC_IP=$(curl -fsSL https://ifconfig.me 2>/dev/null || \
                curl -fsSL https://api.ipify.org 2>/dev/null || \
                echo "localhost")
    info "Detected public IP: $PUBLIC_IP"
}

# ── Prompt for domain ──────────────────────────────────────────────────────
ask_domain() {
    echo ""
    echo -e "${YELLOW}Do you have a domain name pointed at this server?${NC}"
    echo "  Enter your domain (e.g. nenyax.example.com) for auto HTTPS,"
    echo "  or press Enter to use IP-based access (HTTP only)."
    echo ""
    read -rp "Domain (or Enter to skip): " USER_DOMAIN

    if [ -n "$USER_DOMAIN" ]; then
        NENYAX_URL="https://$USER_DOMAIN"
        ok "Will configure HTTPS for: $USER_DOMAIN"
    else
        NENYAX_URL="https://$PUBLIC_IP"
        ok "Will configure HTTPS (self-signed) at: https://$PUBLIC_IP"
    fi
}

# ── Configure firewall ─────────────────────────────────────────────────────
configure_firewall() {
    if command -v ufw &>/dev/null; then
        info "Configuring firewall (ufw)..."
        ufw allow 80/tcp >/dev/null 2>&1 || true
        ufw allow 443/tcp >/dev/null 2>&1 || true
        ufw allow 22/tcp >/dev/null 2>&1 || true
        ok "Firewall: ports 80, 443, 22 open"
    elif command -v firewall-cmd &>/dev/null; then
        info "Configuring firewall (firewalld)..."
        firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
        firewall-cmd --permanent --add-service=https >/dev/null 2>&1 || true
        firewall-cmd --reload >/dev/null 2>&1 || true
        ok "Firewall: HTTP/HTTPS open"
    else
        warn "No firewall detected. Make sure ports 80 and 443 are open."
    fi
}

# ── Clone or update repo ───────────────────────────────────────────────────
clone_repo() {
    if [ -d "$NENYAX_DIR/.git" ]; then
        info "Nenyax directory exists, pulling latest..."
        cd "$NENYAX_DIR"
        git remote set-url origin "$REPO_URL"
        git fetch origin
        git reset --hard "origin/$BRANCH"
        ok "Updated to latest"
    else
        info "Cloning Nenyax..."
        git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$NENYAX_DIR"
        ok "Cloned to $NENYAX_DIR"
    fi
    cd "$NENYAX_DIR"
}

# ── Generate self-signed certs ──────────────────────────────────────────────
generate_certs() {
    if [ -n "$USER_DOMAIN" ]; then
        # Real domain — Caddy handles certs via Let's Encrypt, no self-signed needed
        mkdir -p "$NENYAX_DIR/certs"
        # Create dummy files so the volume mount doesn't fail
        touch "$NENYAX_DIR/certs/cert.pem" "$NENYAX_DIR/certs/key.pem"
        return
    fi

    if [ -f "$NENYAX_DIR/certs/cert.pem" ] && [ -s "$NENYAX_DIR/certs/cert.pem" ]; then
        ok "Self-signed certs already exist"
        return
    fi

    info "Generating self-signed HTTPS certificate..."
    mkdir -p "$NENYAX_DIR/certs"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$NENYAX_DIR/certs/key.pem" \
        -out "$NENYAX_DIR/certs/cert.pem" \
        -subj "/CN=$PUBLIC_IP" \
        -addext "subjectAltName=IP:$PUBLIC_IP" \
        2>/dev/null
    ok "Self-signed HTTPS certificate generated"
}

# ── Write Caddyfile ─────────────────────────────────────────────────────────
write_caddyfile() {
    local CADDY_ROUTES='
	handle /api/auth/* {
		reverse_proxy frontend:3000
	}

	handle /api/livekit/* {
		reverse_proxy frontend:3000
	}

	handle /api/* {
		reverse_proxy backend:8000
	}

	handle /ws/* {
		reverse_proxy backend:8000
	}

	handle {
		reverse_proxy frontend:3000
	}'

    if [ -n "$USER_DOMAIN" ]; then
        cat > "$NENYAX_DIR/Caddyfile" <<EOF
$USER_DOMAIN {
$CADDY_ROUTES
}
EOF
        ok "Caddyfile: HTTPS with Let's Encrypt for $USER_DOMAIN"
    else
        cat > "$NENYAX_DIR/Caddyfile" <<EOF
:443 {
	tls /certs/cert.pem /certs/key.pem
$CADDY_ROUTES
}
EOF
        ok "Caddyfile: self-signed HTTPS on :443"
    fi
}

# ── Generate .env ───────────────────────────────────────────────────────────
generate_env() {
    if [ -f "$NENYAX_DIR/.env" ]; then
        warn ".env already exists — preserving existing credentials"
        # Update only the URL config (in case domain changed)
        sed -i "s|^NENYAX_URL=.*|NENYAX_URL=$NENYAX_URL|" "$NENYAX_DIR/.env"
        # Source existing values for the summary printout
        . "$NENYAX_DIR/.env"
        ok "Updated URL config in existing .env"
        return
    fi

    POSTGRES_PASSWORD=$(gen_password)
    MINIO_ROOT_USER="nenyax-minio"
    MINIO_ROOT_PASSWORD=$(gen_password)
    BETTER_AUTH_SECRET=$(gen_password)

    cat > "$NENYAX_DIR/.env" <<EOF
# Nenyax Production Environment
# Auto-generated by install.sh — $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# =============================================

# Infrastructure (auto-generated, no need to change)
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
MINIO_ROOT_USER=$MINIO_ROOT_USER
MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET

# URL Configuration
NENYAX_URL=$NENYAX_URL
EOF

    chmod 600 "$NENYAX_DIR/.env"
    ok "Generated .env with secure random credentials"
}

# ── Start services ──────────────────────────────────────────────────────────
start_services() {
    info "Building and starting Nenyax (this may take 3-5 minutes on first run)..."
    cd "$NENYAX_DIR"
    docker compose -f docker-compose.prod.yml up -d --build

    info "Waiting for services to be healthy..."
    sleep 10

    # Check if backend is responding
    RETRIES=30
    for i in $(seq 1 $RETRIES); do
        if docker exec nenyax-backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" >/dev/null 2>&1; then
            ok "Backend is healthy"
            break
        fi
        if [ "$i" -eq "$RETRIES" ]; then
            warn "Backend health check timed out — it may still be starting. Check: docker logs nenyax-backend"
        fi
        sleep 5
    done
}

# ── Build base agent image ──────────────────────────────────────────────────
build_base_image() {
    info "Building custom agent base image (for custom agents)..."
    cd "$NENYAX_DIR"
    docker build -t nenyax-agent-base:latest -f agent/Dockerfile.base agent/
    ok "Base agent image built: nenyax-agent-base:latest"
}

# ── Print summary ───────────────────────────────────────────────────────────
print_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║             Nenyax is running!                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}URL:${NC}        $NENYAX_URL"
    echo ""
    echo -e "  ${CYAN}Credentials (saved to $NENYAX_DIR/.env):${NC}"
    echo -e "    Postgres:  postgres:$POSTGRES_PASSWORD @ localhost:5432"
    echo -e "    MinIO:     $MINIO_ROOT_USER:$MINIO_ROOT_PASSWORD"
    echo ""
    echo -e "  ${CYAN}Next steps:${NC}"
    echo "    1. Open $NENYAX_URL in your browser"
    echo "    2. Create your account"
    echo "    3. Go to Settings → API Keys and add your provider keys"
    echo "       (LiveKit, Google AI, Resemble AI, etc.)"
    echo ""
    echo -e "  ${CYAN}Useful commands:${NC}"
    echo "    cd $NENYAX_DIR"
    echo "    docker compose -f docker-compose.prod.yml logs -f     # View logs"
    echo "    docker compose -f docker-compose.prod.yml restart      # Restart"
    echo "    docker compose -f docker-compose.prod.yml down         # Stop"
    echo "    docker compose -f docker-compose.prod.yml pull && \\"
    echo "    docker compose -f docker-compose.prod.yml up -d        # Update"
    echo ""
}

# ── Main ────────────────────────────────────────────────────────────────────
main() {
    detect_os
    install_docker
    install_git
    detect_ip
    ask_domain
    configure_firewall
    clone_repo
    generate_certs
    write_caddyfile
    generate_env
    start_services
    build_base_image
    print_summary
}

main "$@"
