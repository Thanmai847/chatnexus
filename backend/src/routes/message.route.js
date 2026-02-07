import express from "express";

const router =express.Router();

router.get("/sent", (req,res) => {
    res.send("sent u ");
});

export default router;