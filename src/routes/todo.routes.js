const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).send("todoroute is here..")
})

module.exports = router;