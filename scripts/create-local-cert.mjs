import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ip = process.argv[2]
if (!ip || !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) || ip.split('.').some((part) => Number(part) > 255)) {
  console.error('Usage: node scripts/create-local-cert.mjs <laptop LAN IPv4>')
  process.exit(1)
}

const dir = resolve('certs')
mkdirSync(dir, { recursive: true, mode: 0o700 })
const config = resolve(dir, 'openssl.cnf')
writeFileSync(config, `[req]\ndistinguished_name=dn\nprompt=no\nreq_extensions=v3_req\n[dn]\nCN=${ip}\n[v3_req]\nsubjectAltName=@alt_names\nextendedKeyUsage=serverAuth\n[alt_names]\nDNS.1=localhost\nIP.1=127.0.0.1\nIP.2=${ip}\n`)
const run = (...args) => execFileSync('openssl', args, { cwd: dir, stdio: 'inherit' })
run('req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '365', '-subj', '/CN=Teploshchit Local CA', '-keyout', 'ca.key', '-out', 'ca.crt')
run('req', '-new', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-config', 'openssl.cnf', '-keyout', 'server.key', '-out', 'server.csr')
run('x509', '-req', '-in', 'server.csr', '-CA', 'ca.crt', '-CAkey', 'ca.key', '-CAcreateserial', '-out', 'server.crt', '-days', '365', '-sha256', '-extensions', 'v3_req', '-extfile', 'openssl.cnf')
console.log(`Certificate for ${ip} created in ${dir}. Install ca.crt as a trusted CA on the phone.`)
