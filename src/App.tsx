import { useEffect, useState } from "react";
import ProductCodeBox from "./components/productCodeBox";
import { open } from "@tauri-apps/api/dialog";
import { appDir, resolve } from "@tauri-apps/api/path";
import { crawlProductInfo, crawlProductDetail, login } from "./crawler/scraper";
import { createDir, FsDirOptions, Dir } from "@tauri-apps/api/fs";

function App() {
  useEffect(() => {
    document.cookie =
      "PHPSSID" +
      "=; expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=C.kr;path=/;";

    document.cookie =
      "ci_session" +
      "=; expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=C.kr;path=/;";
  });

  const [productCodes, setProductCodes] = useState<string[]>([]);
  const [currentCodesInput, setCurrentCodesInput] = useState("");

  type prd = {
    name: string;
    href: string;
    code: string;
    num: string | undefined;
  };

  const [prdInfo, setPrdInfo] = useState<prd[]>([]);

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

  let [id, setId] = useState("");
  let [pw, setPw] = useState("");
  const [idErr, setIdErr] = useState("");
  const [pwErr, setPwErr] = useState("");

  const onStartClick = async () => {
    const selectedDir = await open({
      directory: true,
      multiple: false,
      defaultPath: await appDir(),
    });

    const selectedDirOption: FsDirOptions = {};

    setIdErr("");
    setPwErr("");

    const result = crawlProductInfo(productCodes);
    setPrdInfo(result);

    if (id === "" && pw === "") {
      setIdErr("아이디 항목은 필수 입력입니다.");
      setPwErr("비밀번호 항목은 필수 입력입니다.");
    } else if (id === "") {
      setIdErr("아이디 항목은 필수 입력입니다.");
    } else if (pw === "") {
      setPwErr("비밀번호 항목은 필수 입력입니다.");
    }

    login(id, pw)
      .then((err) => {
        if (err !== true) {
          if (err === "blankBoth") {
            console.log("im here1");
            setIdErr("아이디 항목은 필수 입력입니다.");
            setPwErr("비밀번호 항목은 필수 입력입니다.");
          } else if (err === "blankId") {
            console.log("im here2");
            setIdErr("아이디 항목은 필수 입력입니다.");
          } else if (err === "blankPw") {
            console.log("im here3");
            setPwErr("비밀번호 항목은 필수 입력입니다.");
          }

          if (err === "idInvalid") {
            setIdErr("아이디가 존재하지 않습니다.");
          } else if (err === "pwInvalid") {
            setPwErr("비밀번호가 잘못되었습니다.");
          }
        }
      })
      .then(() => {
        prdInfo.map((prd) => {
          crawlProductDetail(prd.href);
        });
      });
  };

  return (
    <main className="w-screen h-screen flex justify-center items-center space-x-5">
      <div className="flex justify-center flex-col items-center">
        <form className="flex flex-col items-center space-y-2">
          <div className="flex justify-center items-start flex-col space-y-1">
            <div className="flex justify-between w-full  items-center">
              <h1 className="text-white text-[16px]">ID</h1>
              <h1 className="text-[#ff6961] text-[11px]">{idErr}</h1>
            </div>
            <input
              onChange={(e) => setId(e.target.value)}
              className="shadow-lg w-[200px] h-[35px] rounded-sm outline-none px-3 font-[robotoMD]"
            />
          </div>
          <div className="flex justify-center items-start flex-col space-y-1">
            <div className="flex justify-between w-full items-center">
              <h1 className="text-white text-[16px]">PW</h1>
              <h1 className="text-[#ff6961] text-[11px]">{pwErr}</h1>
            </div>
            <input
              onChange={(e) => setPw(e.target.value)}
              className="w-[200px] h-[35px] rounded-sm outline-none px-3 font-[robotoMD]"
            />
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
        <button
          onClick={onStartClick}
          className="bg-white w-[200px] h-[30px] rounded-sm mt-7"
        >
          START
        </button>
      </div>
      <div className="border-white border-solid border-[2px] w-60 h-[263px] rounded flex flex-col px-3 py-5 text-white text-[16px] space-y-2 overflow-y-scroll">
        {productCodes.map((code, index) => {
          if (code !== "")
            return (
              <ProductCodeBox
                code={code}
                setProductCodes={setProductCodes}
                productCodes={productCodes}
                index={index}
              />
            );
        })}
      </div>
    </main>
  );
}

export default App;
