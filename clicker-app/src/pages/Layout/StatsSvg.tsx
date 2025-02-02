export const StatsSvg = ({ isActive }: { isActive: boolean }) => {
  const color = isActive ? "#FCBE23" : "#FFFFFF";
  return (
    <svg
      width="19"
      height="20"
      viewBox="0 0 19 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 15.9476V20.0276"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M2 18.9725V20.0003"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M10 12.4725V20.0082"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M14 8.45294V20.0161"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M18 4.45782V20.0141"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M1 15.4725L14.5 1.97247"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M9.25 1.97247H14.5"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  );
};
