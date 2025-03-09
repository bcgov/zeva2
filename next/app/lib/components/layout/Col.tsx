import React from 'react';

export interface IColProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

/**
* Simple component that renders a flex-col div, useful for creating grid items when paired with <Row>
*/
export const Col: React.FC<IColProps> = ({ children, className, ...rest }) => {
  return <div className={`flex flex-col ${className}`} {...rest}> {children}</div >;
}
