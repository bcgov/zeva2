"use client";

const Button = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: string;
}) => {
  return <button onClick={() => onClick()}>{children}</button>;
};

export { Button };
