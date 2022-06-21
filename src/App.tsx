import { useEffect, useState } from "react";
import ProductCodeBox from "./components/productCodeBox";

function App() {
  const [productCodes, setProductCodes] = useState<string[]>([]);
  const [currentCodesInput, setCurrentCodesInput] = useState("");

  const productCodeChanges = (e: any) => {
    e.preventDefault();
    const value = `${e.target.value}`;
    setCurrentCodesInput(value);

    if (value === "") {
      setProductCodes([]);
      return;
    }
    const formatedValue = value.split(",");

    setProductCodes(formatedValue);
  };

  useEffect(() => {
    currentCodesInput.split(",").map((element: string) => {
      if (!productCodes.includes(element)) {
        const pushData = currentCodesInput
          .split(",")
          .filter((element2: any) => element2 !== element);
        setCurrentCodesInput(pushData.join(","));
      }
    });
  }, [productCodes]);

  return (
    <main className="w-screen h-screen flex justify-center items-center space-x-5">
      <div className="flex justify-center flex-col items-center">
        <form className="flex flex-col items-center space-y-2">
          <div className="flex justify-center items-start flex-col space-y-1">
            <h1 className="text-white text-[16px]">ID</h1>
            <input className="shadow-lg w-[200px] h-[35px] rounded-sm outline-none px-3 font-[robotoMD]" />
          </div>
          <div className="flex justify-center items-start flex-col space-y-1">
            <h1 className="text-white text-[16px]">PW</h1>
            <input className="w-[200px] h-[35px] rounded-sm outline-none px-3 font-[robotoMD]" />
          </div>
          <div className="flex justify-center items-start flex-col space-y-1">
            <h1 className="text-white font-semibold text-[16px]">제품코드</h1>
            <input
              id="productCodeInput"
              onChange={productCodeChanges}
              value={currentCodesInput}
              className="w-[200px] h-[35px] rounded-sm outline-none px-3 font-[robotoMD]"
            />
          </div>
        </form>
        <button className="bg-white w-[200px] h-[30px] rounded-sm mt-7">
          START
        </button>
      </div>
      <div className="border-white border-solid border-[2px] w-60 h-[263px] rounded flex flex-col px-3 py-5 text-white text-[16px] space-y-2 overflow-y-scroll">
        {productCodes.map((code) => {
          if (code !== "")
            return (
              <ProductCodeBox
                code={code}
                setProductCodes={setProductCodes}
                productCodes={productCodes}
              />
            );
        })}
      </div>
    </main>
  );
}

export default App;
