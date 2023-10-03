import logo from "./assets/logo.svg";

function App() {
  const onClick = async () => {
    let constructUrl = "https://stroygetter.stroyco.eu/?search=";
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    constructUrl += tab.url;

    // Open the url in a new tab
    chrome.tabs.create({ url: constructUrl });
  };

  return (
    <>
      <header className="flex flex-col bg-primary px-4 py-2 w-[300px]">
        <img src={logo} alt="StroyGetter" className="aspect-square h-24" />
        <h1 className="my-auto ml-4 text-3xl font-bold text-center">
          StroyGetter
        </h1>
      </header>
      <main className="mx-auto flex justify-center my-6 w-[300px]">
        <button
          type="button"
          onClick={onClick}
          className="flex w-9/12 flex-row justify-center rounded-lg border-2 border-transparent bg-[#102F42] px-4 py-2 text-center font-bold text-white transition-all ease-in-out hover:cursor-pointer hover:border-primary hover:bg-secondary text-lg"
        >
          Get the video !
        </button>
      </main>
    </>
  );
}

export default App;
