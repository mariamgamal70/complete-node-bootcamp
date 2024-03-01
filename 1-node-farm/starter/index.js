const http=require('http')
const fs=require('fs')
const url=require('url')

const replaceTemplate = require('./modules/replaceTemplate')

const overview=fs.readFileSync(`${__dirname}/templates/overview.html`,'utf-8');
const product = fs.readFileSync(`${__dirname}/templates/product.html`, "utf-8");
const card = fs.readFileSync(`${__dirname}/templates/card.html`, "utf-8");
const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, "utf-8");
const dataObj=JSON.parse(data)




const server= http.createServer((req,res)=>{
    const { query, pathname } = url.parse(req.url, true);

    if (pathname === "/" || pathname === "/overview") {
      res.writeHead(200, { "Content-type": "text/html" });
      const cardsHtml = dataObj.map((el) => replaceTemplate(card, el)).join("");
      const output = overview.replace("{%PRODUCT_CARDS%}", cardsHtml);
      res.end(output);
    } else if (pathname === "/product") {
      res.writeHead(200, { "Content-type": "text/html" });
      productdata = dataObj[query.id];
      output = replaceTemplate(product, productdata);
      res.end(output);
    } else if (pathname === "/api") {
      res.writeHead(200, { "Content-type": "application/json" });
      res.end(data);
    } else {
      res.writeHead(404, {
        "Content-type": "text/html",
        "my-own-header": "hello-world",
      });
      res.end("<h1> page not found </h1>");
    }
});
server.listen(8000, "127.0.0.1", () => {
  console.log("Listening to requests on port 8000");
});