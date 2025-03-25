import React from 'react';

export interface IRowProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

/**
* Simple component that renders a flex-row div, useful for creating grid items when paired with <Col>
*/
export const Row: React.FC<IRowProps> = ({ children, className, ...rest }) => {
  return <div className={`flex flex-row ${className}`} {...rest}> {children}</div >;
}
