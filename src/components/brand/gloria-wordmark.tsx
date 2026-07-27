export function GloriaWordmark({
  className = "h-9 w-auto",
  title,
  width,
  height,
}: {
  className?: string;
  title?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      viewBox="0 0 300 96"
      className={className}
      width={width}
      height={height}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M34 8C16.2 8 4 21.2 4 40.5S16.2 73 34 73c7.3 0 13.3-2.2 18-6.7v2.5C52 79 45.8 84 34 84c-8.1 0-15.1-2.4-21.1-7.2L5.8 87C13.6 93 23 96 34.2 96 55.1 96 68 85 68 64.7V10H52v6.5C47.4 10.8 41.3 8 34 8Zm2 15.5c10 0 17 7.1 17 17s-7 17-17 17-17-7.1-17-17 7-17 17-17Z"
      />
      <path
        fill="currentColor"
        d="M77 1h16v63.4c0 5.7 2.5 8.1 7.7 8.1h4.3v14H96c-12.7 0-19-7.1-19-21.2V1Z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M136 8c-20.1 0-34 13.6-34 32.5S115.9 73 136 73s34-13.6 34-32.5S156.1 8 136 8Zm0 15.5c10.4 0 18 7.1 18 17s-7.6 17-18 17-18-7.1-18-17 7.6-17 18-17Z"
      />
      <path
        fill="currentColor"
        d="M176 10h16v8.8C196.8 11.6 204 8 213.6 8h3.4v17h-6.3C198.5 25 192 31.7 192 44.8V72h-16V10Z"
      />
      <path fill="currentColor" d="M219 27h16v45h-16z" />
      <path
        fill="#a8d829"
        d="M226.4 2.3c6.7-1.5 11.2 4.2 9.1 10.1-2.1 6-8.4 9.1-15.5 7.4-1.7-6.8.3-13.9 6.4-17.5Z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M266 8c-18.4 0-31 13.6-31 32.5S247.6 73 266 73c7.1 0 13-2.6 17-7.7V72h15V10h-15v6.1C279 10.7 273.1 8 266 8Zm2 15.5c9.5 0 16 7.1 16 17s-6.5 17-16 17-17-7.1-17-17 7.5-17 17-17Z"
      />
    </svg>
  );
}
