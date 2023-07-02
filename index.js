const requestPromise = require("request-promise");
const cheerio = require("cheerio");
const fs = require("fs");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 80;
const db = require("./db");
const axios = require("axios");
const cron = require("node-cron");
// const router = require("./routers");
const cors = require("cors");
db.connect();

app.use(express.json());
const flipkartData = require("./models/flipkart");
const snapDealData = require("./models/snapDeal");

const mobiles = [];
const mobiles1 = [];

const API =
  "https://www.flipkart.com/search?q=mobile&sid=tyy%2C4io&as=on&as-show=on&otracker=AS_QueryStore_OrganicAutoSuggest_1_2_na_na_na&otracker1=AS_QueryStore_OrganicAutoSuggest_1_2_na_na_na&as-pos=1&as-type=RECENT&suggestionId=mobile%7CMobiles&requestId=fafb5c4a-a8a8-43d2-85e4-29b363176925&as-searchtext=mo";

const scrapeMobiles = async () => {
  try {
    const { data } = await axios.get(API);
    const $ = cheerio.load(data);

    $("._1AtVbE").each((index, element) => {
      const title = $(element).find("._4rR01T").text().trim();
      const price = $(element).find("._3I9_wc").text().trim();
      const image = $(element).find("._396cs4").attr("src");
      const rating = $(element).find("._3LWZlK").text().trim();
      const offerprice = $(element).find("._30jeq3").text().trim();

      const mobile = {
        title,
        price,
        image,
        rating,
        offerprice,
      };

      mobiles.push(mobile);
    });
    // console.log(mobiles);
    return mobiles;
  } catch (error) {
    console.error(error);
    return [];
  }
};

// .then((mobileData) => {
//   console.log(mobileData);
// })
// .catch((error) => {
//   console.error(error);
// });

//#######################################################################################################

const APISNAP =
  "https://www.snapdeal.com/search?keyword=mobiles&santizedKeyword=mobile+cover&catId=0&categoryId=0&suggested=false&vertical=p&noOfResults=20&searchState=&clickSrc=go_header&lastKeyword=&prodCatId=&changeBackToAll=false&foundInAll=false&categoryIdSearched=&cityPageUrl=&categoryUrl=&url=&utmContent=&dealDetail=&sort=rlvncy";

const scrapeMobilessnap = async () => {
  // console.log(API);
  try {
    const { data } = await axios.get(APISNAP);

    const $ = cheerio.load(data);
    $(".col-xs-6").each((index, element) => {
      const title = $(element).find(".product-title").text().trim();
      const price = $(element)
        .find(".lfloat.product-desc-price.strike")
        .text()
        .trim();
      const image = $(element).find(".picture-elem  img").attr("src");
      const rating = $(element).find(".product-rating-count").text().trim();
      const offerprice = $(element).find(".lfloat.product-price").text().trim();
      console.log(image);
      const mobile1 = {
        title,
        price,
        image,
        rating,
        offerprice,
      };

      mobiles1.push(mobile1);
    });

    return mobiles1;
  } catch (error) {
    console.error(error);
    return [];
  }
};

scrapeMobiles();
scrapeMobilessnap();
// .then((mobileData1) => {
//   console.log(mobileData1);
// })
// .catch((error) => {
//   console.error(error + "snapdeal");
// });

//#################################################################################################

const saveToMongoDB = async () => {
  try {
    // Clear the existing data before inserting new data
    await flipkartData.deleteMany({});
    await flipkartData.insertMany(mobiles);

    // Insert the scraped data into the respective collections
    await snapDealData.deleteMany({});
    await snapDealData.insertMany(mobiles1);

    console.log("Data saved to MongoDB Atlas successfully.");
  } catch (error) {
    console.error("Error saving data to MongoDB Atlas:", error);
  }
};
// saveToMongoDB();

const fetchData = async () => {
  try {
    const mobileData = await scrapeMobiles();
    const mobileData1 = await scrapeMobilessnap();

    mobiles.push(...mobileData);
    mobiles1.push(...mobileData1);

    saveToMongoDB();
  } catch (error) {
    console.error("Error scraping and saving data:", error);
  }
};

fetchData();

app.get("/getmobiledata", async (req, res) => {
  try {
    const mobilefromdbfkt = await flipkartData.find({});
    const mobileDatafkt = mobilefromdbfkt.map((mobile) => mobile.toObject());

    const mobilefromdb = await snapDealData.find({});
    const mobileData = mobilefromdb.map((mobile) => mobile.toObject());
    const allMobileData = [...mobileData, ...mobileDatafkt]; // Combine the arrays

    res.send(allMobileData);
  } catch (error) {
    return res.status(400).json({ message: error });
  }
});

const start = async () => {
  saveToMongoDB();
};

setInterval(start, 12 * 3600 * 1000);

app.listen(PORT, () => {
  console.log(`App is running on ${PORT}`);
  // scheduleScraping();
});
