import express from "express";

const router =express.Router();

router.get("/signin", (req,res) => {
    res.send("sign in ");
});

router.get("/signup", (req,res) => {
    res.send("sign up ");
});

export default router;