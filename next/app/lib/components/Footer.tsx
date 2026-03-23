export const Footer = () => {
  const version = process.env.ZEVA2_VERSION ?? "dev";

  return (
    <footer className="w-full bg-primaryBlue px-4 py-2 text-center text-xs text-white">
      <a
        className="text-white underline-offset-2 hover:underline"
        href="https://github.com/bcgov/zeva2/releases"
        target="_blank"
        rel="noreferrer"
      >
        {version}
      </a>
    </footer>
  );
};
