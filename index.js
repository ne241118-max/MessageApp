const express = require("express");
const { Sequelize, DataTypes, Op } = require("sequelize");

const app = express();
app.use(express.urlencoded({ extended: true }));

let DB_INFO = "postgres://hellodb:myPostgres@postgres:5432/hellodb";
let pg_option = {};

if (process.env.DATABASE_URL) {
  DB_INFO = process.env.DATABASE_URL;
  pg_option = { ssl: { rejectUnauthorized: false } };
}

const sequelize = new Sequelize(DB_INFO, {
  dialect: "postgres",
  dialectOptions: pg_option,
});

const Messages = sequelize.define(
  "messages",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    message: DataTypes.TEXT,
  },
  {
    freezeTableName: true,
  }
);

let lastMessage = "";

function setupRoute() {
  app.get("/", (req, res) => {
    res.render("top.ejs");
  });

  app.get("/add", (req, res) => {
    res.render("add.ejs", { lastMessage: lastMessage });
  });

  app.post("/add", async (req, res) => {
    let newMessage = new Messages({
      message: req.body.text,
    });

    try {
      await newMessage.save();
      lastMessage = req.body.text;
      res.render("add.ejs", { lastMessage: lastMessage });
    } catch (error) {
      console.log(error);
      res.status(500).send("error");
    }
  });

  app.get("/view", async (req, res) => {
    try {
      let result = await Messages.findAll();
      let allMessages = result.map((e) => {
        return e.message + " " + e.createdAt;
      });
      res.render("view.ejs", { messages: allMessages });
    } catch (error) {
      console.log(error);
      res.status(500).send("error");
    }
  });

  app.get("/search", (req, res) => {
    res.render("search.ejs", { messages: [] });
  });

  app.post("/search", async (req, res) => {
    try {
      let result = await Messages.findAll({
        where: {
          message: {
            [Op.regexp]: req.body.searchText,
          },
        },
      });

      let allMessages = result.map((e) => {
        return e.message + " " + e.createdAt;
      });

      res.render("search.ejs", {
        messages: allMessages,
        searchText: req.body.searchText,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("error");
    }
  });
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    await sequelize.sync({ force: false, alter: true });
    console.log("Database synchronized successfully.");

    setupRoute();

    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error("Database error:", error);
  }
}

main();