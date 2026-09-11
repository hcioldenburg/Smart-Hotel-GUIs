#!/usr/bin/env bash
# Creates a local certificate authority and a server certificate for the study
# tablet, so the two conditions can be served over real HTTPS.
#
# Why this is needed: Android/Chrome only turns a site into a true installed app
# (a "WebAPK", which is what honours display:fullscreen and hides the system and
# browser bars) when it is served from a genuinely secure origin. A plain
# http:// LAN address — even one allow-listed via chrome://flags — passes the
# installability checks but then falls back to a bookmark that opens in Chrome.
#
# mkcert does this too, but is not installed here; openssl ships with Git Bash.
#
#   bash scripts/make-certs.sh [ip]        # default ip: 192.168.178.37
#
# Outputs (all git-ignored — rootCA-key.pem is a private key, never commit it):
#   certs/rootCA.pem       <- install THIS one on the Android tablet
#   certs/rootCA-key.pem   <- signs the server cert; keep on this machine only
#   certs/cert.pem         <- server certificate, used by Vite
#   certs/key.pem          <- server private key, used by Vite
set -euo pipefail

# Run from the project root and use RELATIVE paths throughout. Git Bash rewrites a
# leading "/" into a Windows path, which corrupts openssl's "-subj /CN=..." — but
# setting MSYS_NO_PATHCONV globally breaks the /c/... file paths instead. So the
# fix is: relative paths everywhere, and disable conversion only on the one
# command that passes a "/CN=..." subject.
cd "$(dirname "${BASH_SOURCE[0]}")/.."

IP="${1:-192.168.178.37}"
DIR="certs"
mkdir -p "$DIR"

echo "Generating certificates for $IP"

# --- Root CA (long-lived; this is what gets trusted on the tablet) ---
# Everything comes from a config file rather than -subj/-addext. Two reasons:
# "-subj /CN=..." gets mangled into a Windows path by Git Bash, and "-addext
# basicConstraints" ADDS to the default v3_ca extensions instead of replacing
# them — producing a cert with two Basic Constraints extensions, which is
# malformed, so nothing will chain to it.
cat > "$DIR/ca.cnf" <<'EOF'
[req]
distinguished_name = dn
x509_extensions    = v3_ca
prompt             = no

[dn]
CN = SmartHotel Lab Local CA
O  = SmartHotel Lab

[v3_ca]
basicConstraints     = critical, CA:TRUE, pathlen:0
keyUsage             = critical, keyCertSign, cRLSign
subjectKeyIdentifier = hash
EOF

if [ ! -f "$DIR/rootCA.pem" ]; then
  openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
    -keyout "$DIR/rootCA-key.pem" -out "$DIR/rootCA.pem" \
    -config "$DIR/ca.cnf" 2>/dev/null
  echo "  created root CA"
else
  echo "  reusing existing root CA"
fi

# --- Server certificate. Chrome requires the IP in a subjectAltName; a CN alone
#     is ignored. 397 days keeps it inside the maximum lifetime browsers accept. ---
cat > "$DIR/san.cnf" <<EOF
[req]
distinguished_name = dn
prompt             = no

# NOTE: no req_extensions here. The v3_req section below carries
# authorityKeyIdentifier, which cannot be computed while building the CSR (there
# is no issuer yet) and makes "openssl req" fail. These extensions are applied at
# SIGNING time instead, via -extfile/-extensions, where the CA is known.

[dn]
CN = $IP

[v3_req]
basicConstraints       = CA:FALSE
keyUsage               = critical, digitalSignature, keyEncipherment
extendedKeyUsage       = serverAuth
subjectAltName         = @alt
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid,issuer

[alt]
IP.1  = $IP
IP.2  = 127.0.0.1
DNS.1 = localhost
EOF

openssl req -newkey rsa:2048 -nodes \
  -keyout "$DIR/key.pem" -out "$DIR/server.csr" \
  -config "$DIR/san.cnf" 2>/dev/null

openssl x509 -req -in "$DIR/server.csr" \
  -CA "$DIR/rootCA.pem" -CAkey "$DIR/rootCA-key.pem" -CAcreateserial \
  -out "$DIR/cert.pem" -days 397 -sha256 \
  -extfile "$DIR/san.cnf" -extensions v3_req 2>/dev/null

rm -f "$DIR/server.csr" "$DIR/rootCA.srl"

echo
echo "Done. Vite picks these up automatically on the next start."
openssl x509 -in "$DIR/cert.pem" -noout -subject -enddate -ext subjectAltName
