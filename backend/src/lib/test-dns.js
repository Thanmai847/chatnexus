import * as dns from 'dns';

// override system DNS servers for this process (use Google/Cloudflare)
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function test() {
  try {
    console.log('using DNS servers:', dns.getServers());
    const res = await dns.promises.resolveSrv('_mongodb._tcp.cluster0.ptjsf5u.mongodb.net');
    console.log('resolveSrv result:', res);
  } catch (err) {
    console.error('resolveSrv error:', err);
    process.exitCode = 1;
  }
}

test();
