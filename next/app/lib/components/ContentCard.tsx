"use client";

export interface IContentCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Component that displays content to the user on a "floating card". Used in the dashboard currently.
 *
 */
export const ContentCard: React.FC<IContentCardProps> = ({
  title,
  icon,
  children,
  ...rest
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-level-1 hover:shadow-level-2 transition-shadow duration-200 p-6 mb-2 ${rest.className}`}
    >
      <h2 className="text-xl font-semibold text-primaryBlue">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
};
