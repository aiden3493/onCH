import axios from "axios";
import { load } from "cheerio";

export async function getHTML(url: string) {
  try {
    return await axios.get(url);
  } catch (err) {
    console.log(err);
  }
}

export function test() {
  getHTML("https://onch3.co.kr").then((html) => {
    const products = [
      "main_prod_price",
      "main_prod_delivery",
      "new_product_channel",
      "onch_in_product",
      "md_product",
      "keyword_product",
      "recommend_product",
    ];

    let List: any = {};
    const $ = load(html?.data);

    for (const i of products) {
      let ulList: any = [];

      const $bodyList = $(`div.prod_wrap`)
        .children(`div.${i}`)
        .children("ul")
        .children("li.prod_li")
        .children("ul");

      $bodyList.each((i, elem) => {
        const title = $(elem)
          .find("li.product_title")
          .text()
          .replaceAll("\t", "")
          .replaceAll("\n", "");

        const code = $(elem)
          .find("li.li_info")
          .eq(1)
          .text()
          .replaceAll("\t", "")
          .replaceAll("\n", "")
          .replaceAll("제품코드 : ", "");

        const href = $(elem).find("li.li_info").find("a").attr("href");

        const num = href?.startsWith("https://www.onch3.co.kr/onch_view.html?")
          ? href?.split("?")[1]?.split("&")[0].replaceAll("num=", "")
          : undefined;

        ulList[i] = {
          title: title,
          href: href,
          code: code,
          num: num,
        };
      });

      List[i] = ulList;
    }

    console.log(List);
  });
}
