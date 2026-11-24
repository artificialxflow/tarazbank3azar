import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const FONTS_DIR = path.resolve(process.cwd(), 'public', 'fonts');

const FONT_FILES = [
  {
    name: 'Shabnam-Regular.woff2',
    url: 'https://raw.githubusercontent.com/rastikerdar/shabnam-font/master/dist/Shabnam.woff2',
  },
  {
    name: 'Shabnam-Medium.woff2',
    url: 'https://raw.githubusercontent.com/rastikerdar/shabnam-font/master/dist/Shabnam-Medium.woff2',
  },
  {
    name: 'Shabnam-Bold.woff2',
    url: 'https://raw.githubusercontent.com/rastikerdar/shabnam-font/master/dist/Shabnam-Bold.woff2',
  },
];

function downloadFile(url, destPath, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'TarazBank-Font-Provisioner/1.0',
        },
        timeout: 12000,
      },
      (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location &&
          redirectsLeft > 0
        ) {
          response.resume();
          const nextUrl = new URL(response.headers.location, url).toString();
          downloadFile(nextUrl, destPath, redirectsLeft - 1).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`HTTP ${response.statusCode} while fetching ${url}`));
          return;
        }

        const tempPath = `${destPath}.tmp`;
        const fileStream = fs.createWriteStream(tempPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            try {
              fs.renameSync(tempPath, destPath);
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        });

        fileStream.on('error', (err) => {
          try {
            fs.unlinkSync(tempPath);
          } catch {
            // ignore cleanup errors
          }
          reject(err);
        });
      }
    );

    request.on('timeout', () => {
      request.destroy(new Error('Request timed out'));
    });

    request.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    fs.mkdirSync(FONTS_DIR, { recursive: true });
  } catch (err) {
    console.warn('[setup-fonts] Unable to create public/fonts directory:', err.message);
    return;
  }

  for (const font of FONT_FILES) {
    const destPath = path.join(FONTS_DIR, font.name);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1024) {
      continue;
    }

    try {
      await downloadFile(font.url, destPath);
      console.log(`[setup-fonts] Provisioned ${font.name}`);
    } catch (err) {
      console.warn(
        `[setup-fonts] Offline or unreachable while fetching ${font.name}: ${err.message}. Build will proceed safely.`
      );
    }
  }
}

main().catch((err) => {
  console.warn('[setup-fonts] Non-fatal error:', err.message);
});
