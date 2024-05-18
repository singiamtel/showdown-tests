// dotenv
import { config } from "dotenv";
import { Client } from 'ps-client';
config();


type Server = {
  url: string,
  port: number,
}

const supportedServers: Server[] = [
  {
    url: 'sim3.psim.us',
    port: 443,
  },
];

const supportedURLsLoginServer = [
  "https://play.pokemonshowdown.com/api/",
  "https://play.pokemonshowdown.com/action.php",
  "https://play.pokemonshowdown.com/~~showdown/action.php",
];

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
assert(username !== undefined, 'Username not defined');
assert(password !== undefined, 'Password not defined');

process.on('unhandledRejection', (reason, promise) => {
  console.debug('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function testServer(server: Server, loginserver: string, timeout = 10000) {
  return new Promise<void>((resolve, reject) => {
    const client = new Client({
      username: username!,
      password: password!,
      server: server.url,
      loginServer: loginserver,
      rooms: [],
      autoReconnect: false,
    });

    const timer = setTimeout(async () => {
      console.log('Timeout');

      await wait(1000); // wait for the client to stabilize
      client.disconnect();
      reject('Timeout');
    }, timeout);

    client.on('login', async () => {
      console.log('Logged in');
      clearTimeout(timer);
      await wait(1000); // wait for the client to stabilize
      client.disconnect();
      void resolve();
    })

    // client.on('line', (line) => {
      // console.log('Line received', line);
    // })

    client.connect()
  })
}

async function main() {
  const promises = [];

  for (const server of supportedServers) {
    for (const loginserver of supportedURLsLoginServer) {
      //test server
      promises.push(testServer(server, loginserver));
    }
  }
  try {
    await Promise.all(promises);
    console.log('All tests passed');
  }
  catch (e) {
    console.error('Error', e);
    process.exit(1);
  }
}

main();

