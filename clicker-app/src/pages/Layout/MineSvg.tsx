export const MineSvg = ({ isActive }: { isActive: boolean }) => {
  const color = isActive ? "#FCBE23" : "#FFFFFF";
  return (
    <svg
      width="22"
      height="20"
      viewBox="0 0 22 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 19L1 7.25L3.84744 1H18.1525L21 7.25L11 19Z"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M15 7L11 11.5L7 7"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};
