import axios from "axios";
import { load } from "cheerio";
axios.defaults.withCredentials = true;

async function getHTML(url: string) {
  try {
    return await axios.get(url);
  } catch (err) {}
}

export function crawlProductInfo(productCodes: string[]) {
  type prd = {
    name: string;
    href: string;
    code: string;
    num: string | undefined;
  };

  let results: prd[] = [];
  for (const i of productCodes) {
    getHTML(`/search?sear_txt=${i}`).then((html) => {
      const $ = load(html?.data);

      const $bodyList = $(`div.prd_list_group`)
        .find("li.sale_product")
        .find("ul.prd_info");

      const title = $bodyList
        .find("li.prd_name")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");

      const code = $bodyList
        .find("li.prd_code")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "")
        .replaceAll("제품코드 : ", "")
        .replaceAll(" ", "");

      const href = `https://www.onch3.co.kr/${$bodyList
        .find("li.prd_img")
        .find("a")
        .attr("href")}`;

      const num = href?.startsWith("https://www.onch3.co.kr/onch_view.html?")
        ? href?.split("?")[1]?.split("&")[0].replaceAll("num=", "")
        : undefined;

      const packagedHREF = href.replace(
        "https://www.onch3.co.kr/onch_view.html",
        "/detail"
      );

      const prd = {
        name: title,
        href: packagedHREF,
        code: code,
        num: num,
      };

      results.push(prd);
    });
  }
  return results;
}

export async function login(id: string, pw: string) {
  let form = new FormData();
  form.append("login_url", "https://www.onch3.co.kr/");
  form.append("login", id);
  form.append("password", pw);

  let SSID: string = "";
  let goto: string = "";
  let popup: string = "N";

  //get PHPSSID
  const getPHPSSID = await axios.get("/main");

  //get SSID, goto, popup
  const loginResult = await axios
    .post("/login", form)
    .then((res) => {
      const $ = load(res?.data);

      const $body = $("body");

      const blankMsg = $body.find("p");
      if (blankMsg.length === 3) {
        return "blankBoth";
      } else if (blankMsg.length === 2) {
        if (blankMsg.first().text() === "아이디 항목은 필수 입력입니다.") {
          return "blankId";
        } else {
          return "blankPw";
        }
      }

      const feedbackMsg = $body.find("div");

      const idFeedBackMsg = feedbackMsg.eq(6).text();
      const pwFeedBackMsg = feedbackMsg.eq(8).text();

      if (idFeedBackMsg.replaceAll("\n", "") !== "") {
        return "idInvalid";
      } else if (pwFeedBackMsg.replaceAll("\n", "") !== "") {
        return "pwInvalid";
      }

      const $ssidForm = $("form#f_goto");

      const ssidInputText = `${$ssidForm
        .children('[name="ssid"]')
        .attr("value")}`;

      const gotoInputText = `${$ssidForm
        .children('[name="goto"]')
        .attr("value")}`;

      SSID = ssidInputText;
      goto = gotoInputText;

      return true;
    })
    .catch((err) => {
      return err;
    });

  if (loginResult !== true) {
    return loginResult;
  }

  //enable PHPSSID
  let SSIDform = new FormData();
  SSIDform.append("ssid", SSID);
  SSIDform.append("goto", goto);
  SSIDform.append("popup", popup);

  const enablePHPSSID = await axios.post("/auth", SSIDform);
}

export async function crawlProductDetail(url: string) {
  await getHTML(url).then((html) => {
    const $ = load(html?.data);
    const $detail_prod = $("div.prod_detail_box").find(
      "div.detail_page_option"
    );

    type optionData = {
      옵션명: string;
      최종준수가: string;
      소비자가: string;
      판매자가: string;
      최소수량: string;
    };

    const options = $detail_prod.find("ul").find("li");

    const optionsList: optionData[] = [];

    options.each((_, elem) => {
      const data: optionData | any = {};

      const element = $(elem);

      data.옵션명 = element
        .find("span.detail_page_name")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");
      data.최종준수가 = element
        .find("span.detail_page_price_1")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");
      data.소비자가 = element
        .find("span.detail_page_price_2")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");
      data.판매자가 = element
        .find("span.detail_page_price_3")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");
      data.최소수량 = element
        .find("span.detail_page_min")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");

      optionsList.push(data);
    });

    console.table(optionsList);
    return optionsList;
  });
}
