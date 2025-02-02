export const WalletSvg = ({ isActive }: { isActive: boolean }) => {
  const color = isActive ? "#FCBE23" : "#FFFFFF";
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.99103 4.98445L14.8923 1L17.1985 4.99445L7.99103 4.98445Z"
        stroke={color}
        stroke-opacity="0.9"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M1 6C1 5.4477 1.44771 5 2 5H20C20.5523 5 21 5.4477 21 6V20C21 20.5523 20.5523 21 20 21H2C1.44771 21 1 20.5523 1 20V6Z"
        stroke={color}
        stroke-opacity="0.9"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path
        d="M16.625 15.5H21V10.5H16.625C15.1753 10.5 14 11.6193 14 13C14 14.3807 15.1753 15.5 16.625 15.5Z"
        stroke={color}
        stroke-opacity="0.9"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path
        d="M21 7.25V19.25"
        stroke={color}
        stroke-opacity="0.9"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  );
};
