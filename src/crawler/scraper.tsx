import axios from "axios";
import { load } from "cheerio";
import { Buffer } from "buffer";

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
        .replaceAll(" ", "")
        .replaceAll("제품번호:", "");

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
  await axios.get("/main");

  //get SSID, goto, popup
  const loginResult = await axios
    .post("/login", form)
    .then((res) => {
      const $ = load(res?.data);

      const $body = $("body");

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

  await axios.post("/auth", SSIDform);
}

export async function crawlProductDetail(url: string) {
  const result = await getHTML(url).then((html) => {
    type detailType = {
      options: object[];
      images: any[];
      dlevPrice: string;
    };
    const detail: detailType = { options: [{}], images: [], dlevPrice: "" };

    const $ = load(html?.data);
    const $detail_prod = $("div.prod_detail_box");

    type optionData = {
      optionName: string;
      finalCompliance: string;
      retailPrice: string;
      sellerPrice: string;
      MinimumQuantity: string;
    };

    const options = $detail_prod
      .find("div.detail_page_option")
      .find("ul")
      .find("li");

    const optionsList: optionData[] = [];

    options.each((_, elem) => {
      const data: optionData | any = {};

      const element = $(elem);

      data.optionName = element
        .find("span.detail_page_name")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");
      data.finalCompliance = element
        .find("span.detail_page_price_1")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");
      data.retailPrice = element
        .find("span.detail_page_price_2")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");
      data.sellerPrice = element
        .find("span.detail_page_price_3")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");
      data.MinimumQuantity = element
        .find("span.detail_page_min")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");

      optionsList.push(data);
    });

    detail.options = optionsList;

    const imagesURL: any[] = [];
    const images: any[] = [];

    const imageDiv = $("div.prod_detail_div")
      .children("div.prod_detail_imgbox")
      .find("a")
      .find("img");

    imageDiv.each((_, elem) => {
      const element = $(elem);

      imagesURL.push(element.attr("src"));
    });

    for (const i of imagesURL) {
      const queryData = i.replaceAll(
        "https://image.onch3.co.kr/img_data",
        "/img"
      );

      axios
        .get(queryData, { withCredentials: false, responseType: "arraybuffer" })
        .then((res) => {
          if (res) {
            const LAST_INDEX = queryData.split("/").length - 1;
            const fileName = queryData.split("/")[LAST_INDEX];

            const file = res.data;
            images.push({ fileName, file });
          }
        })
        .then(() => {
          detail.images = images;
        });
    }

    const dlevPrice = $("div.prod_detail_content");
    detail.dlevPrice = dlevPrice
      .text()
      .replaceAll("\n", "")
      .replaceAll("\t", "");

    return detail;
  });

  return result;
}
