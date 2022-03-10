import axios from "axios";
import express from "express";
import bodyParser from 'body-parser';
const app = express();
const port = process.env.PORT || 3000;
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.get('/token', urlencodedParser, async (req, res) => {
    const id = req.body.id;
    const secret = req.body.secret;
    const token = await axios.post('https://api.servicefusion.com/oauth/access_token',
        {
            "grant_type": "client_credentials",
            "client_id": id,
            "client_secret": secret
        },
        {
            headers: {'Content-Type': 'application/json'},
            cors: 'no-cors',
        });
  await res.send(token.data);
})


app.get('/jobs', urlencodedParser, async (req, res) => {
    const token = req.body.token;
    const phone = req.body.phone;
    const daysMargin = req.body.daysMargin;
    const date = new Date(req.body.date);
    let total_spent = 0;
    let total_owed = 0;
    let amount_of_jobs = 0;

    let jobs = await axios.get(`https://api.servicefusion.com/v1/jobs?access_token=${token}&filters[phone]=${phone}`)

    for (let currentPage = 1; currentPage <= jobs.data._meta.pageCount; currentPage++){
        for (let i = 0; i < jobs.data.items.length; i++){
            const diffTime = Math.abs(new Date(jobs.data.items[i].closed_at) - date)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            if (diffDays <= daysMargin) {
                total_spent += jobs.data.items[i].payments_deposits_total;
                total_owed += jobs.data.items[i].due_total;
                amount_of_jobs++;
            }
        }
    }

    const customer_name = jobs.data.items[0].customer_name
    res.send({ customer_name, total_spent, total_owed, amount_of_jobs})
})


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
