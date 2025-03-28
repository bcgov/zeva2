
import React from "react";

/**
 * The Show component conditionally renders its children when the "when" prop is true.
 *
 * Example usage:
 * <Show when={isLoggedIn}>
 *   <div>Welcome back, user!</div>
 * </Show>
 *
 * If "isLoggedIn" is false, nothing is rendered.
 *
 */
export interface IShowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  when: boolean;
}

export const Show: React.FC<IShowProps> = ({ children, when, ...rest }) => {
  return when ? <div {...rest}>{children}</div> : null;
};
