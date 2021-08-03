module.exports = async function (context, req) {
  context.res = {
    status: req.query.statuscode || "200",
    body: ["npm install --global <b>@manekinekko/hexa</b>", "hexa <b>init</b>", "hexa <b>deploy</b>", "hexa <b>init --login</b>", "hexa <b>init --manual</b>", "hexa <b>init --yolo</b>"],
  };
};
