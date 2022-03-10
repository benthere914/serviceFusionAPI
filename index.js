import axios from "axios";
import express from "express";
import bodyParser from 'body-parser';
const app = express();
const port = process.env.port || 3000;
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.get('/', (req, res) => {
    res.send('hello world')
})
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

    let [jobs, customer] = await Promise.all([
        axios.get(`https://api.servicefusion.com/v1/jobs?access_token=${token}&filters[phone]=${phone}`),
        axios.get(`https://api.servicefusion.com/v1/customers?access_token=${token}&filters[phone]=${phone}`)
    ])

    let total_spent = 0;
    let total_owed = 0;
    let amount_of_jobs = 0;
    const page_count = jobs.data._meta.pageCount;
    for (let currentPage = 1; currentPage <= page_count; currentPage++){
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

    const pmp = customer.data.items[0].assigned_contract;
    const customer_name = customer.data.items[0].customer_name
    res.send({customer_name, total_spent, total_owed, amount_of_jobs, pmp})
})


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
