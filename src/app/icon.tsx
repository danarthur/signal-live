import { ImageResponse } from 'next/og';

/** Same squircle as LivingLogo idle state — "Bouba" shape. */
const IDLE_PATH =
  'M 20 5.5 C 30 5.5 34.5 10 34.5 20 C 34.5 30 30 34.5 20 34.5 C 10 34.5 5.5 30 5.5 20 C 5.5 10 10 5.5 20 5.5 Z';

const CERAMIC = '#FDFCF8';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="32" height="32"><path d="${IDLE_PATH}" fill="none" stroke="${CERAMIC}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} width={32} height={32} alt="" />
      </div>
    ),
    { width: 32, height: 32 }
  );
}
