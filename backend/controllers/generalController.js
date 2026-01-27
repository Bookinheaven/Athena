import getQuotesAPI from "../utils/getQuotesAPI.js"

export const getQuotes = async (req, res) => {
    try {
        let data = await getQuotesAPI()
        res.status(200).json({ data });
    } catch(error) {
        res.status(500).json({
            message: "Server error while getQuotes",
            error: error.message
        })
    }
}