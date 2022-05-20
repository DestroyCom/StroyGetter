import logo from "../assets/img/logo.svg";

const Header = () => {
  return (
    <header className="flex flex-row w-[100%] p-6 ">
      <div className="flex flex-row w-[18%] h-[10vh]">
        <img src={logo} alt="StroyGetter" className="m-auto max-h-full" />
        <h1 className="text-3xl m-auto font-bold">StroyGetter</h1>
      </div>
    </header>
  );
};

export default Header;
