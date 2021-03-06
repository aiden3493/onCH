import { useEffect, useState } from "react";
import ProductCodeBox from "./components/productCodeBox";
import { open } from "@tauri-apps/api/dialog";
import { checkUpdate, installUpdate } from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";
import { crawlProductInfo, crawlProductDetail, login } from "./crawler/scraper";
import { createDir, writeBinaryFile, writeTextFile } from "@tauri-apps/api/fs";

function App() {
  useEffect(() => {
    async function update() {
      try {
        const { shouldUpdate, manifest } = await checkUpdate();
        if (shouldUpdate) {
          await installUpdate();
          await relaunch();
        }
      } catch (err) {
        console.log(err);
      }
    }

    update();
  });
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
  const [finished, setFinished] = useState(false);

  type prd = {
    name: string;
    href: string;
    code: string;
    num: string | undefined;
  };

  const productCodeChanges = (e: any) => {
    e.preventDefault();
    const value = `${e.target.value}`;
    setCurrentCodesInput(value);

    if (value === "") {
      setProductCodes([]);
      return;
    }
    const formatedValue = value.split(",");

    setProductCodes([...formatedValue]);
  };

  useEffect(() => {
    currentCodesInput.split(",").map(async (element: string) => {
      if (!productCodes.includes(element)) {
        const pushData = currentCodesInput
          .split(",")
          .filter((element2: any) => element2 !== element);
        await setCurrentCodesInput(() => pushData.join(","));
      }
    });
  }, [productCodes]);

  let [id, setId] = useState(() => "");
  let [pw, setPw] = useState(() => "");
  const [idErr, setIdErr] = useState("");
  const [pwErr, setPwErr] = useState("");

  const onStartClick = async () => {
    setFinished(false);
    setIdErr("");
    setPwErr("");

    if (id === "" && pw === "") {
      setIdErr(() => "????????? ????????? ?????? ???????????????.");
      return setPwErr(() => "???????????? ????????? ?????? ???????????????.");
    } else if (id === "") {
      return setIdErr(() => "????????? ????????? ?????? ???????????????.");
    } else if (pw === "") {
      return setPwErr(() => "???????????? ????????? ?????? ???????????????.");
    }

    if (productCodes.length === 0) return;

    const result = crawlProductInfo(productCodes);
    const prdInfo: prd[] = result;

    const selectedDir = await open({
      directory: true,
      multiple: false,
    });

    if (selectedDir) {
      await login(id, pw)
        .then(async (err) => {
          if (err == false) {
            if (err === "idInvalid") {
              setIdErr("???????????? ???????????? ????????????.");
            } else if (err === "pwInvalid") {
              setPwErr("??????????????? ?????????????????????.");
            }
          }
        })
        .then(() => {
          prdInfo.map(async (prd) => {
            const detail = await crawlProductDetail(prd.href);
            await createDir(`${selectedDir}/${prd.code}`, {
              recursive: true,
            }).then(async () => {
              await createDir(`${selectedDir}/${prd.code}/images`);
              detail.images.map(async (i) => {
                await writeBinaryFile(
                  `${selectedDir}/${prd.code}/images/${i.fileName}`,
                  new Uint8Array(i.file)
                );
                await writeTextFile({
                  path: `${selectedDir}/${prd.code}/options.html`,
                  contents: `
                      <!DOCTYPE html>
                      <html lang="en">
                        <head>
                          <meta charset="UTF-8" />
                          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                          <title>Options</title>
                          <style>
                            body {
                              width: 100vw;
                              height: 100vh;
                              display: flex;
                              justify-content: center;
                              align-items: center;
                              flex-direction: column
                            }
                            th,
                            td {
                              padding: 10px;
                            }
                            h1 {
                              font-size: 13px
                            }
                          </style>
                        </head>
                        <body>
                          <table border="1">
                            <th>?????????</th>
                            <th>???????????????</th>
                            <th>????????????</th>
                            <th>????????????</th>
                            <th>????????????</th>
                            ${detail.options.map(
                              (option: any) => `
                            <tr>
                              <td>${option.optionName}</td>
                              <td>${option.finalCompliance}</td>
                              <td>${option.retailPrice}</td>
                              <td>${option.sellerPrice}</td>
                              <td>${option.MinimumQuantity}</td>
                            </tr>
                            `
                            )}
                          </table>
                          <h1>${detail.dlevPrice}</h1>
                        </body>
                      </html>
                  `.toString(),
                });
              });
            });
          });
        })
        .then(() => {
          setFinished(true);
        });
    }
  };

  return (
    <main className="w-screen h-screen flex flex-col justify-center items-center space-x-5">
      <div className="flex justify-center space-x-5">
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
              <h1 className="text-white font-semibold text-[16px]">????????????</h1>
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
        <div className=" overflow-x-hidden border-white border-solid border-[2px] w-60 h-[263px] rounded flex flex-col px-3 py-5 text-white text-[16px] space-y-2 overflow-y-scroll">
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
      </div>
      {finished ? (
        <div className="absolute top-10">
          <h1 className="text-green-300">????????? ?????????????????????</h1>
        </div>
      ) : null}
    </main>
  );
}

export default App;
