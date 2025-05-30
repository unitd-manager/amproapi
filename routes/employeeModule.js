const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/Database.js');
const userMiddleware = require('../middleware/UserModel.js');
var md5 = require('md5');
const fileUpload = require('express-fileupload');
const _ = require('lodash');
const mime = require('mime-types')
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
app.use(cors());

app.use(fileUpload({
    createParentPath: true
}));

app.post('/import/excel', (req, res) => {
    const { data } = req.body;
    const parsed_data = JSON.parse(data);
console.log('parsed_data',parsed_data);
    const limit = parsed_data.length;
    const count = [];
    const connection = db;
    
    connection.beginTransaction((err) => {
        if (err) {
            connection.rollback(() => { console.log(err); });
        } else {
            insertRows(connection);
        }
    });

    function insertRows(connection) {
        connection.query(
            "INSERT INTO employee (`employee_name`, `salutation`, `gender`, `date_of_birth`, `nationality`, `race`, `position`, `mobile`, `email`, `status`) VALUES (?,?,?,?,?,?,?,?,?,?);",
            [
                parsed_data[count.length].Name,
                parsed_data[count.length].Salutation,
                parsed_data[count.length].Gender,
                parsed_data[count.length].Dob,
                parsed_data[count.length].Nationality,
                parsed_data[count.length].Race,
                parsed_data[count.length].Occupation,
                parsed_data[count.length].HandphoneNo,
                parsed_data[count.length].EmailID,
                'Current'
            ],
            (err, rslt) => {
                if (err) {
                    connection.rollback(() => { console.log(err); });
                    res.send(err);
                    res.end();
                } else {
                    connection.query(
                        "INSERT INTO job_information (`employee_id`, `work_hour_details`, `working_days`,`basic_pay`,`act_join_date`) VALUES (?,?,?,?,?);",
                        [
                            rslt.insertId,
                            parsed_data[count.length].Detailsofworkinghours,
                            parsed_data[count.length].Noofworkingdays,
                            parsed_data[count.length].BasicPay,
                             parsed_data[count.length].EmploymentStartDate,
                        ],
                        (err) => {
                            if (err) {
                                connection.rollback(() => { console.log(err); });
                                res.send(err);
                                res.end();
                            } else {
                                next(connection, parsed_data[count.length].Name);
                            }
                        }
                    );
                }
            }
        );
    }

    function next(connection, name) {
        if ((count.length + 1) === limit) {
            connection.commit((err) => {
                if (err) {
                    connection.rollback(() => { console.log(err); });
                    res.send('err');
                    res.end();
                } else {
                    console.log("RECORDS INSERTED!!!");
                    res.send('SUCCESS');
                    res.end();
                }
            });
        } else {
            console.log(`${name} inserted`);
            count.push(1);
            insertRows(connection);
        }
    }
});


app.get('/getEmployee', (req, res, next) => {
  db.query(`SELECT DISTINCT a.employee_id AS employee_id_duplicate
  ,a.emp_code
  ,a.employee_id
  ,a.first_name
  ,a.employee_name
  ,a.salutation
  ,a.gender
  ,a.status
  ,a.date_of_birth
  ,a.passport
  ,a.date_of_expiry
  ,a.marital_status
  ,a.nationality
  ,a.race
  ,a.pay
  ,a.notes
  ,a.religion
  ,a.project_designation
  ,a.team
  ,gc.name AS country_name
  ,a.email AS login_email
  ,a.pass_word AS login_pass_word
  ,a.user_group_id AS staff_user_group_id
  ,a.published AS staff_published
FROM employee a
LEFT JOIN geo_country gc ON (a.address_country = gc.country_code)
LEFT JOIN job_information j ON (a.employee_id = j.employee_id)
LEFT JOIN staff s ON (a.employee_id = s.employee_id)
WHERE a.employee_id != ''
ORDER BY a.employee_name ASC`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.get('/getArchiveEmployee', (req, res, next) => {
  db.query(`SELECT DISTINCT a.employee_id AS employee_id_duplicate
  ,a.emp_code
  ,a.employee_name
  ,a.salutation
  ,a.gender
  ,a.status
  ,a.date_of_birth
  ,a.passport
  ,a.date_of_expiry
  ,a.marital_status
  ,a.nationality
  ,a.race
  ,a.pay
  ,a.notes
  ,a.religion
  ,a.project_designation
  ,a.team
  ,gc.name AS country_name
  ,a.email AS login_email
  ,a.pass_word AS login_pass_word
  ,a.user_group_id AS staff_user_group_id
  ,a.published AS staff_published
FROM employee a
LEFT JOIN geo_country gc ON (a.address_country = gc.country_code)
LEFT JOIN job_information j ON (a.employee_id = j.employee_id)
LEFT JOIN staff s ON (a.employee_id = s.employee_id)
WHERE a.employee_id != '' AND a.status ='Archive'
ORDER BY a.employee_name ASC`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});


app.post('/getCurrentEmployeeFromLocation', (req, res, next) => {
  let siteIdCondition = '';

  // Check if site_id is an empty string and handle it as 'IS NULL' for SQL query
  if (req.body.site_id === '' || req.body.site_id === null || req.body.site_id === undefined ) {
    siteIdCondition = 'AND (a.site_id = 0 OR a.site_id IS NULL)';
  } else {
    siteIdCondition = `AND a.site_id = ${db.escape(req.body.site_id)}`;
  }

  const query = `
  SELECT DISTINCT a.employee_id AS employee_id_duplicate
  ,a.emp_code
  ,a.first_name
  ,a.first_name_arb
  ,a.employee_name
  ,a.salutation
  ,a.salutation_arb
  ,a.gender
  ,a.gender_arb
  ,a.status
  ,a.status_arb
  ,a.date_of_birth
  ,a.passport
  ,a.date_of_expiry
  ,a.work_permit_expiry_date
  ,a.marital_status
  ,a.marital_status_arb
  ,a.nationality
  ,a.nationality_arb
  ,a.citizen
  ,a.citizen_arb
  ,a.race
  ,a.notes
  ,a.religion
  ,a.project_designation
  ,a.team
  ,a.company_id
  ,gc.name AS country_name
  ,a.email AS login_email
  ,a.pass_word AS login_pass_word
  ,a.user_group_id AS staff_user_group_id
  ,a.published AS staff_published
  ,j.act_join_date
FROM employee a
LEFT JOIN geo_country gc ON (a.address_country = gc.country_code)
LEFT JOIN job_information j ON (a.employee_id = j.employee_id)
LEFT JOIN staff s ON (a.employee_id = s.employee_id)
WHERE a.employee_id != '' AND a.status ='Current'${siteIdCondition}
ORDER BY a.employee_name ASC  
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.log('error: ', err);
      return res.status(400).send({
        data: err,
        msg: 'failed',
      });
    } else {
      return res.status(200).send({
        data: result,
        msg: 'Success',
      });
    }
  });
});


app.get('/getCurrentEmployee', (req, res, next) => {
  db.query(`SELECT DISTINCT a.employee_id AS employee_id_duplicate
  ,a.emp_code
  ,a.first_name
  ,a.first_name_arb
  ,a.employee_name
  ,a.salutation
  ,a.salutation_arb
  ,a.gender
  ,a.gender_arb
  ,a.status
  ,a.status_arb
  ,a.date_of_birth
  ,a.passport
  ,a.date_of_expiry
  ,a.work_permit_expiry_date
  ,a.marital_status
  ,a.marital_status_arb
  ,a.nationality
  ,a.nationality_arb
  ,a.citizen
  ,a.citizen_arb
  ,a.race
  ,a.notes
  ,a.religion
  ,a.project_designation
  ,a.team
  ,a.company_id
  ,gc.name AS country_name
  ,a.email AS login_email
  ,a.pass_word AS login_pass_word
  ,a.user_group_id AS staff_user_group_id
  ,a.published AS staff_published
  ,j.act_join_date
FROM employee a
LEFT JOIN geo_country gc ON (a.address_country = gc.country_code)
LEFT JOIN job_information j ON (a.employee_id = j.employee_id)
LEFT JOIN staff s ON (a.employee_id = s.employee_id)
WHERE a.employee_id != '' AND a.status ='Current'
ORDER BY a.employee_name ASC`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
   }
 );
});

app.post('/getEmployeeByID', (req, res, next) => {
  db.query(`SELECT DISTINCT a.employee_id
  ,a.emp_code
  ,a.first_name
  ,a.first_name_arb
  ,a.employee_name
  ,a.employee_name_arb
  ,a.salutation
  ,a.salutation_arb
  ,a.gender
  ,a.gender_arb
  ,a.status
  ,a.status_arb
  ,a.date_of_birth
  ,a.passport
  ,a.date_of_expiry
  ,a.marital_status
  ,a.marital_status_arb
  ,a.nationality
  ,a.nationality_arb
  ,a.race
  ,a.race_arb
  ,a.religion
  ,a.religion_arb
  ,a.project_designation
  ,a.project_designation_arb
  ,a.project_manager
  ,a.project_manager_arb
  ,a.admin_staff
  ,a.admin_staff_arb
  ,a.team
  ,a.team_arb
  ,a.company_id
  ,a.notes
  ,a.notes_arb
  ,gc.name AS country_name
  ,a.email AS login_email
  ,a.email_arb AS login_email_arb
  ,a.pass_word AS login_pass_word
  ,a.user_group_id AS staff_user_group_id
  ,a.published 
  ,a.published_arb
  ,j.act_join_date
  ,a.pay
  ,a.pay_arb
  ,a.creation_date
  ,a.modification_date
  ,a.created_by
  ,a.modified_by
FROM employee a
LEFT JOIN geo_country gc ON (a.address_country = gc.country_code)
LEFT JOIN job_information j ON (a.employee_id = j.employee_id)
LEFT JOIN staff s ON (a.employee_id = s.employee_id)
WHERE a.employee_id = ${db.escape(req.body.employee_id)}
ORDER BY a.employee_name ASC`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.post('/edit-Employee', (req, res, next) => {
  db.query(
    `UPDATE employee  
     SET employee_name=${db.escape(req.body.employee_name)},
         employee_name_arb=${db.escape(req.body.employee_name_arb)},
         first_name=${db.escape(req.body.first_name)},
         creation_date=${db.escape(req.body.creation_date)},
         created_by=${db.escape(req.body.created_by)},
         modification_date=${db.escape(req.body.modification_date)},
         modified_by=${db.escape(req.body.modified_by)},
         first_name_arb=${db.escape(req.body.first_name_arb)},
         salutation=${db.escape(req.body.salutation)},
         salutation_arb=${db.escape(req.body.salutation_arb)},
         emp_code=${db.escape(req.body.emp_code)},
         emp_code_arb=${db.escape(req.body.emp_code_arb)},
         gender=${db.escape(req.body.gender)},
         gender_arb=${db.escape(req.body.gender_arb)},
         status=${db.escape(req.body.status)},
         status_arb=${db.escape(req.body.status_arb)},
         date_of_birth=${db.escape(
           new Date(req.body.date_of_birth).toISOString().slice(0, 19).replace("T", " ")
         )},
         passport=${db.escape(req.body.passport)},
         date_of_expiry=${db.escape(
           new Date(req.body.date_of_expiry).toISOString().slice(0, 19).replace("T", " ")
         )},
         marital_status=${db.escape(req.body.marital_status)},
         marital_status_arb=${db.escape(req.body.marital_status_arb)},
         nationality=${db.escape(req.body.nationality)},
         nationality_arb=${db.escape(req.body.nationality_arb)},
         race=${db.escape(req.body.race)},
         race_arb=${db.escape(req.body.race_arb)},
         religion=${db.escape(req.body.religion)},
         religion_arb=${db.escape(req.body.religion_arb)},
         project_designation=${db.escape(req.body.project_designation)},
         project_designation_arb=${db.escape(req.body.project_designation_arb)},
         team=${db.escape(req.body.team)},
         team_arb=${db.escape(req.body.team_arb)},
         team_leader=${db.escape(req.body.team_leader)},
         team_leader_arb=${db.escape(req.body.team_leader_arb)},
         project_manager=${db.escape(req.body.project_manager)},
         project_manager_arb=${db.escape(req.body.project_manager_arb)},
         email=${db.escape(req.body.login_email)},
         email_arb=${db.escape(req.body.login_email_arb)},
         pass_word=${db.escape(req.body.login_pass_word)},
         pass_word_arb=${db.escape(req.body.login_pass_word_arb)},
         user_group_id=${db.escape(req.body.staff_user_group_id)},
         published=${db.escape(req.body.published)},
         published_arb=${db.escape(req.body.published_arb)},
         notes=${db.escape(req.body.notes)},
         notes_arb=${db.escape(req.body.notes_arb)},
         pay=${db.escape(req.body.pay)},
         pay_arb=${db.escape(req.body.pay_arb)},
         company_id=${db.escape(req.body.company_id)}
     WHERE employee_id=${db.escape(req.body.employee_id)}`,
    (err, result) => {
      if (err) {
        console.log('error: ', err);
        return res.status(400).send({
          data: err,
          msg: 'failed',
        });
      } else {
        // Check if email, password, and published = 1
        if (
          req.body.login_email &&
          req.body.login_pass_word &&
          req.body.published === 1
        ) {
          // Check if the staff record already exists
          const checkStaffQuery = `
            SELECT * FROM staff WHERE employee_id = ${db.escape(req.body.employee_id)}
          `;
          db.query(checkStaffQuery, (checkErr, checkResult) => {
            if (checkErr) {
              console.log('error checking staff record: ', checkErr);
              return res.status(400).send({
                data: checkErr,
                msg: 'failed to check staff record',
              });
            } else if (checkResult.length > 0) {
              // Staff record already exists
              return res.status(200).send({
                data: result,
                msg: 'Employee updated successfully, staff record already exists',
              });
            } else {
              // Insert new staff record
              const staffQuery = `
                INSERT INTO staff (employee_id, email, pass_word, first_name,user_group_id)
                VALUES (${db.escape(req.body.employee_id)}, ${db.escape(req.body.login_email)}, ${db.escape(req.body.login_pass_word)}, ${db.escape(req.body.employee_name)},     ${db.escape(req.body.staff_user_group_id)}
)
              `;
              db.query(staffQuery, (staffErr, staffResult) => {
                if (staffErr) {
                  console.log('error creating staff record: ', staffErr);
                  return res.status(400).send({
                    data: staffErr,
                    msg: 'failed to create staff record',
                  });
                } else {
                  return res.status(200).send({
                    data: result,
                    msg: 'Employee updated and staff record created successfully',
                  });
                }
              });
            }
          });
        } else {
          return res.status(200).send({
            data: result,
            msg: 'Employee updated successfully',
          });
        }
      }
    }
  );
});


app.post('/edit-notes',(req, res, next) => {
  db.query(`UPDATE employee  
            SET notes=${db.escape(req.body.notes)}
              WHERE employee_id = ${db.escape(req.body.employee_id)}`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
            )});

app.post('/insertEmployee', (req, res, next) => {

  let data = {company_name: req.body.company_name
    , position: req.body.position
    , email: req.body.email
    , address_street: req.body.address_street
    , address_area: req.body.address_area
    , address_town: req.body.address_town
    , address_state: req.body.address_state
    , address_country: req.body.address_country
    , address_po_code: req.body.address_po_code
    , phone: req.body.phone
    , fax: req.body.fax
    , sort_order: req.body.sort_order
    , published: 0
    , creation_date: req.body.creation_date
    , modification_date: req.body.modification_date
    , protected: req.body.protected
    , pass_word: req.body.pass_word
    , subscribe : req.body. subscribe 
    , mobile: req.body.mobile
    , religion: req.body.religion
    , relationship: req.body.relationship
    , known_as_name: req.body.known_as_name
    , address_street1: req.body.address_street1
    , address_town1 : req.body. address_town1 
    , address_country1: req.body. address_country1 
    , flag: req.body.flag
    , sex: req.body.sex
    , date_of_birth: new Date(req.body.date_of_birth)
    , random_no: req.body.random_no
    , member_status: req.body.member_status
    , direct_tel: req.body.direct_tel
    , member_type: req.body.member_type
    , address_flat: req.body.address_flat
    , phone_direct: req.body.phone_direct
    , salutation: req.body.salutation
    , department: req.body.department
    , created_by: req.body.created_by
    , modified_by: req.body.modified_by
    , published_test: req.body.published_test
    , company_address_street: req.body.company_address_street
    , company_address_flat: req.body.company_address_flat
    , company_address_town: req.body.company_address_town
    , company_address_state : req.body. company_address_state 
    , company_address_country: req.body.company_address_country
    , company_address_id: req.body.company_address_id
    , category : req.body. category 
    , status: req.body.status
    , user_group_id: req.body.user_group_id
    , employee_name: req.body.employee_name
    , notes: req.body.notes
    , user_name: req.body.user_name
    , address: req.body.address
    , login_count: req.body.login_count
    , passport: req.body.passport
    , nric_no: req.body.nric_no
    , employee_work_type : req.body. employee_work_type 
    , add_hourly_rate: req.body.add_hourly_rate
    , salary: req.body.salary
    , spass_no: req.body.spass_no
    , date_of_expiry: req.body.date_of_expiry && new Date(req.body.date_of_expiry).toISOString().slice(0, 19).replace("T", " ")
    , day_rate: req.body.day_rate
    , overtime_rate: req.body.overtime_rate
    , emp_code: req.body.emp_code
    , gender: req.body.gender
    , relegion : req.body. relegion 
    , nationality: req.body.nationality
    , foreign_addrs_street: req.body.foreign_addrs_street
    , foreign_addrs_area: req.body.foreign_addrs_area
    ,  foreign_addrs_city : req.body. foreign_addrs_city 
    , foreign_addrs_postal_code: req.body.foreign_addrs_postal_code
    , foreign_addrs_country : req.body.foreign_addrs_country
    , emergency_contact_name: req.body.emergency_contact_name
    , emergency_contact_phone: req.body.emergency_contact_phone
    , emergency_contact_phone2: req.body.emergency_contact_phone2
    , emergency_contact_address: req.body.emergency_contact_address
    , degree1: req.body.degree1
    , educational_qualitifcation1: req.body.educational_qualitifcation1
    , year_of_completion1: req.body.year_of_completion1
    , degree2: req.body.degree2
    , educational_qualitifcation2: req.body.educational_qualitifcation2
    , year_of_completion2: req.body.year_of_completion2
    , degree3: req.body.degree3
    , department: req.body.department
    , educational_qualitifcation3: req.body.educational_qualitifcation3
    , year_of_completion3: req.body.year_of_completion3
    , fin_no: req.body.fin_no
    , marital_status: req.body.marital_status
    , is_citizen: req.body.is_citizen
    , race: req.body.race
    , employee_group : req.body. employee_group 
    , employee_name: req.body.employee_name
    , last_name: req.body.last_name
    , foreign_mobile : req.body. foreign_mobile 
    , foreign_email: req.body.foreign_email
    , spr_year: req.body.spr_year
    , citizen: req.body.citizen
    , date_of_issue: req.body.date_of_issue
    , work_permit: req.body.work_permit
    , fin_no_expiry_date: req.body.fin_no_expiry_date
    , work_permit_expiry_date : req.body. work_permit_expiry_date 
    , ir21_filed: req.body.ir21_filed
    , site_id: req.body.site_id
    , room_no : req.body. room_no 
    , dormitory_id: req.body.dormitory_id
    , employee_type: req.body.employee_type
    , project_designation: req.body.project_designation
    , team : req.body. team 
    , project_manager:0
    , admin_staff: req.body.admin_staff};
  let sql = "INSERT INTO employee SET ?";
  let query = db.query(sql, data,(err, result) => {
    if (err) {
      console.log('error: ', err)
      return res.status(400).send({
        data: err,
        msg: 'failed',
      })
    } else {
      return res.status(200).send({
        data: result,
        msg: 'Success',
          });
    }
  });
});


app.delete('/deleteEmployee', (req, res, next) => {

  let data = {employee_id  : req.body.employee_id  };
  let sql = "DELETE FROM employee WHERE ?";
  let query = db.query(sql, data,(err, result) =>{
    if (err) {
      console.log('error: ', err)
      return res.status(400).send({
        data: err,
        msg: 'failed',
      })
    } else {
      return res.status(200).send({
        data: result,
        msg: 'Success',
          });
    }
  });
});


app.get('/TabPassType', (req, res, next) => {
  db.query(`Select citizen
  ,nric_no  
  ,spr_year
  ,fin_no
  ,fin_no_expiry_date
  ,work_permit
  ,work_permit_expiry_date
  from employee where employee_id !=''`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.post('/getTabPassTypeByID', (req, res, next) => {
  db.query(`Select citizen
  ,employee_id
  ,nric_no  
  ,spr_year
  ,fin_no
  ,fin_no_expiry_date
  ,work_permit
  ,work_permit_expiry_date
  from employee where employee_id = ${db.escape(req.body.employee_id)}`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.post('/Checkedduplicatevalue', (req, res, next) => {
  db.query(` SELECT *
    FROM employee
    WHERE (
      (nric_no = ${db.escape(req.body.nric_no)} OR fin_no = ${db.escape(req.body.fin_no)} OR work_permit = ${db.escape(req.body.work_permit)})
      
    );`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});


app.post('/edit-TabPassType', (req, res, next) => {
  db.query(`UPDATE employee  
            SET citizen=${db.escape(req.body.citizen)}
            ,nric_no=${db.escape(req.body.nric_no)}
            ,spr_year=${db.escape(req.body.spr_year)}
            ,fin_no=${db.escape(req.body.fin_no)}
            ,fin_no_expiry_date=${db.escape(new Date(req.body.fin_no_expiry_date).toISOString().slice(0, 19).replace("T", " "))}
            ,work_permit=${db.escape(req.body.work_permit)}
            ,work_permit_expiry_date=${db.escape(new Date(req.body.work_permit_expiry_date).toISOString().slice(0, 19).replace("T", " "))}
            WHERE employee_id = ${db.escape(req.body.employee_id)}`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
     }
  );
});

app.get('/TabEducationalQualification', (req, res, next) => {
  db.query(`Select e.educational_qualitifcation1
  ,e.year_of_completion1
  ,e.degree1
  ,e.degree2
  ,e.educational_qualitifcation2
  ,e.year_of_completion2
  ,e.degree3
  ,e.educational_qualitifcation3
  ,e.year_of_completion3
  From employee e
  Where e.employee_id != ''`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
 
    }
  );
});

app.post('/TabEducationalQualificationById', (req, res, next) => {
  db.query(`Select 
  e.employee_id
  ,e.degree1
  ,e.educational_qualitifcation1
  ,e.year_of_completion1
  ,e.degree2
  ,e.educational_qualitifcation2
  ,e.year_of_completion2
  ,e.degree3
  ,e.educational_qualitifcation3
  ,e.year_of_completion3
  From employee e
  Where e.employee_id = ${db.escape(req.body.employee_id)}`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.post('/edit-EducationalQualification', (req, res, next) => {
  db.query(`UPDATE employee  
            SET educational_qualitifcation1=${db.escape(req.body.educational_qualitifcation1)}
            ,degree1=${db.escape(req.body.degree1)}
            ,year_of_completion1=${db.escape(new Date(req.body.year_of_completion1).toISOString().slice(0, 19).replace("T", " "))}
            ,degree2=${db.escape(req.body.degree2)}
            ,educational_qualitifcation2=${db.escape(req.body.educational_qualitifcation2)}
            ,year_of_completion2=${db.escape(new Date(req.body.year_of_completion2).toISOString().slice(0, 19).replace("T", " "))}
            ,degree3=${db.escape(req.body.degree3)}
            ,educational_qualitifcation3=${db.escape(req.body.educational_qualitifcation3)}
            ,year_of_completion3=${db.escape(new Date(req.body.year_of_completion3).toISOString().slice(0, 19).replace("T", " "))}
            WHERE employee_id = ${db.escape(req.body.employee_id)}`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
     }
  );
});

app.get('/TabContactInformation', (req, res, next) => {
  db.query(`Select e.address_area,
  e.address_street,
  e.address_po_code,
  e.address_country1,
  e.mobile,
  e.phone,
  e.email,
  e.foreign_addrs_area,
  e.foreign_addrs_street,
  e.foreign_addrs_country,
  e.foreign_addrs_postal_code,
  e.foreign_mobile,
  e.foreign_email,
  e.phone_direct
  From employee e
  Where e.employee_id !=''`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.post('/TabContactInformationById', (req, res, next) => {
  db.query(`Select e.employee_id,
  e.address_area,
  e.address_street,
  e.address_po_code,
  e.address_country1,
  e.mobile,
  e.phone,
  e.email,
  e.foreign_addrs_area,
  e.foreign_addrs_street,
  e.foreign_addrs_country,
  e.foreign_addrs_postal_code,
  e.foreign_mobile,
  e.foreign_email,
  e.phone_direct
  From employee e
  Where e.employee_id =${db.escape(req.body.employee_id)}`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});


app.post('/edit-ContactInformation', (req, res, next) => {
  db.query(`UPDATE employee  
            SET address_area=${db.escape(req.body.address_area)}
            ,address_street=${db.escape(req.body.address_street)}
            ,address_po_code=${db.escape(req.body.address_po_code)}
            ,address_country1="Singapore"
            ,mobile=${db.escape(req.body.mobile)}
            ,phone=${db.escape(req.body.phone)}
            ,email=${db.escape(req.body.email)}
            ,foreign_addrs_area=${db.escape(req.body.foreign_addrs_area)}
            ,foreign_addrs_street=${db.escape(req.body.foreign_addrs_street)}
            ,foreign_addrs_postal_code=${db.escape(req.body.foreign_addrs_postal_code)}
            ,foreign_mobile=${db.escape(req.body.foreign_mobile)}
            ,foreign_email=${db.escape(req.body.foreign_email)}
            ,phone_direct=${db.escape(req.body.phone_direct)}
            WHERE employee_id = ${db.escape(req.body.employee_id)}`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
     }
  );
});

app.get('/TabEmergencyContact', (req, res, next) => {
  db.query(`Select e.emergency_contact_name,
  e.emergency_contact_phone,
  e.emergency_contact_phone2,
  e.emergency_contact_address
  From employee e
  Where e.employee_id!=''`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.post('/TabEmergencyContactById', (req, res, next) => {
  db.query(`Select e.employee_id, 
  e.emergency_contact_name,
  e.emergency_contact_phone,
  e.emergency_contact_phone2,
  e.emergency_contact_address
  From employee e
  Where e.employee_id=${db.escape(req.body.employee_id)}`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.post('/edit-EmergencyContact', (req, res, next) => {
  db.query(`UPDATE employee  
            SET emergency_contact_name=${db.escape(req.body.emergency_contact_name)}
            ,emergency_contact_phone=${db.escape(req.body.emergency_contact_phone)}
            ,emergency_contact_phone2=${db.escape(req.body.emergency_contact_phone2)}
            ,emergency_contact_address=${db.escape(req.body.emergency_contact_address)}
            WHERE employee_id = ${db.escape(req.body.employee_id)}`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
     }
  );
});

app.get('/TabJobInformationHistory', (req, res, next) => {
  db.query(`SELECT ts.training_staff_id
  ,t.title
  ,DATE_FORMAT(ts.from_date, '%d-%m-%Y') AS training_from_date
  ,DATE_FORMAT(ts.to_date, '%d-%m-%Y') AS training_to_date
FROM training_staff ts
LEFT JOIN training t ON (ts.training_id = t.training_id)
WHERE ts.staff_id != ''
ORDER BY ts.to_date DESC`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.post('/TabJobInformationHistoryById', (req, res, next) => {
  db.query(` SELECT j.job_information_id
  ,j.basic_pay
  ,DATE_FORMAT(j.act_join_date, '%d-%m-%Y') AS start_date
  ,DATE_FORMAT(j.termination_date, '%d-%m-%Y') AS end_date
FROM job_information j
WHERE j.employee_id = ${db.escape(req.body.employee_id)}
ORDER BY j.job_information_id DESC`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.get('/getTabTrainingLinked', (req, res, next) => {
  db.query(`  SELECT j.job_information_id
  ,j.basic_pay
  ,DATE_FORMAT(j.act_join_date, '%d-%m-%Y') AS start_date
  ,DATE_FORMAT(j.termination_date, '%d-%m-%Y') AS end_date
FROM job_information j
WHERE j.employee_id != ''
ORDER BY j.job_information_id DESC`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.post('/getTabTrainingLinkedById', (req, res, next) => {
  db.query(`SELECT ts.training_staff_id
  ,t.title
  ,DATE_FORMAT(ts.from_date, '%d-%m-%Y') AS training_from_date
  ,DATE_FORMAT(ts.to_date, '%d-%m-%Y') AS training_to_date
FROM training_staff ts
LEFT JOIN training t ON (ts.training_id = t.training_id)
WHERE ts.staff_id = ${db.escape(req.body.employee_id)}
ORDER BY ts.to_date DESC `,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.post('/getTabTrainingLinkedByEmpId', (req, res, next) => {
  db.query(`SELECT ts.training_staff_id
  ,t.title
  ,DATE_FORMAT(ts.from_date, '%d-%m-%Y') AS training_from_date
  ,DATE_FORMAT(ts.to_date, '%d-%m-%Y') AS training_to_date
FROM training_staff ts
LEFT JOIN training t ON (ts.training_id = t.training_id)
WHERE ts.employee_id = ${db.escape(req.body.employee_id)}
ORDER BY ts.to_date DESC `,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.post('/deleteEmployeeTime', (req, res, next) => {
  let data = { employee_timesheet_id: req.body.employee_timesheet_id }
  let sql = 'DELETE FROM employee_timesheet WHERE ?'
  let query = db.query(sql, data, (err, result) => {
    if (err) {
      console.log('error: ', err)
      return res.status(400).send({
        data: err,
        msg: 'failed',
      })
    } else {
      return res.status(200).send({
        data: result,
        msg: 'Tender has been removed successfully',
      })
    }
  })
})


app.get('/getMaxEmpCode', (req, res, next) => {
  db.query(`SELECT MAX (emp_code) As empc
  FROM employee
  WHERE employee_id !=''`,
    (err, result) => {
       
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
            });
      }
    }
  );
});

app.get('/getQualification', (req, res, next) => {
  db.query(
    `SELECT 
  value
  ,valuelist_id
  FROM valuelist WHERE key_text='Qualification'`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
        })
      }
    },
  )
})

app.get('/getTranslationForEmployee', (req, res, next) => {
  db.query(`SELECT t.value,t.key_text,t.arb_value FROM translation t WHERE key_text LIKE 'mdEmployee%'`,
  (err, result) => {
    if (err) {
      console.log('error: ', err)
      return res.status(400).send({
        data: err,
        msg: 'failed',
      })
    } else {
      return res.status(200).send({
        data: result,
        msg: 'Success',
})
}
  }
);
});

app.get('/secret-route', userMiddleware.isLoggedIn, (req, res, next) => {
  console.log(req.userData);
  res.send('This is the secret content. Only logged in users can see that!');
});

module.exports = app;