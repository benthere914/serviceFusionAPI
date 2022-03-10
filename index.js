import axios from "axios";
import express from "express";
import bodyParser from 'body-parser';
const app = express();
const port = process.env.PORT || 3000;
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.get('/', (req, res) => {
    print('got to the front')
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


// const PORT = process.env.PORT || 3000;
// const express = require("express");
// const app = express();
// app.use(express.json());
// const courses = [
//   { id: 1, name: "Algorithms" },
//   { id: 2, name: "Software Engineering" },
//   { id: 3, name: "Human Computer Interaction" }
// ];
// app.get("/", function(req, res) {
//   //when we get an http get request to the root/homepage
//   res.send("Hello World");
// });
// //when we route to /courses
// app.get("/courses", function(req, res) {
//   res.send(courses); //respond with the array of courses
// });
// //To get a specific course, we need to define a parameter id
// app.get("/courses/:id", function(req, res) {
//   const course = courses.find(c => c.id === parseInt(req.params.id));
//   //if the course does not exist return status 404 (not found)
//   if (!course)
//       return res
//           .status(404)
//           .send("The course with the given id was not found");
//   //return the object
//   res.send(course);
// });
// //using the http post request we can create a new course
// app.post("/courses", function(req, res) {
//   //create a course object
//   const course = {
//       id: courses.length + 1,
//       name: req.body.name
//   };
//   //add the course to the array
//   courses.push(course);
//   //return the course
//   res.send(course);
// });
// app.put("/courses/:id", function(req, res) {
//   //get the course
//   const course = courses.find(c => c.id === parseInt(req.params.id));
//   if (!course)
//       return res
//           .status(404)
//           .send("The course with the given id was not found");
//   //update the course
//   course.name = req.body.name;
//   //return the updated object
//   res.send(course);
// });
// app.put("/courses/:id", function(req, res) {
//   //get the course
//   const course = courses.find(c => c.id === parseInt(req.params.id));
//   if (!course)
//       return res
//           .status(404)
//           .send("The course with the given id was not found");
//   //update the course
//   course.name = req.body.name;
//   //returns the updated object
//   res.send(course);
// });
// app.listen(PORT, function() {
//   console.log(`Listening on Port ${PORT}`);
// });
