export const HomeSvg = ({ isActive }: { isActive: boolean }) => {
  const color = isActive ? "#FCBE23" : "#FFFFFF";
  return (
    <svg
      width="22"
      height="20"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 21C16.5229 21 21 16.5229 21 11C21 5.47715 16.5229 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5229 5.47715 21 11 21Z"
        stroke={color}
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path
        d="M14.5 14.5C14.5 14.5 13.5 16.5 11 16.5C8.5 16.5 7.5 14.5 7.5 14.5"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M15.5 9H13.5"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M7.5 8V10"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};
