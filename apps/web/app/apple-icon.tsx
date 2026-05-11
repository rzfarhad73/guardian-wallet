import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: 40,
        background: "#0d9e7e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <svg width={140} height={140} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C12 2 4 5 4 5.8V12.5C4 17.5 7.5 21.8 12 23.2C16.5 21.8 20 17.5 20 12.5V5.8C20 5 12 2 12 2Z"
          fill="white"
          fillOpacity="0.95"
        />
        <path
          d="M7 12.5C8.5 10.2 10 9.2 12 9.2C14 9.2 15.5 10.2 17 12.5C15.5 14.8 14 15.8 12 15.8C10 15.8 8.5 14.8 7 12.5Z"
          fill="#0d9e7e"
          fillOpacity="0.14"
        />
        <line x1="7" y1="12.5" x2="17" y2="12.5" stroke="#0d9e7e" strokeWidth="0.4" strokeOpacity="0.4" />
        <circle cx="12" cy="12.5" r="2.2" fill="#0d9e7e" fillOpacity="0.85" />
        <circle cx="12" cy="12.5" r="0.88" fill="white" />
        <circle cx="9" cy="12.5" r="0.45" fill="#0d9e7e" fillOpacity="0.6" />
        <circle cx="15" cy="12.5" r="0.45" fill="#0d9e7e" fillOpacity="0.6" />
      </svg>
    </div>,
    { ...size }
  );
}
