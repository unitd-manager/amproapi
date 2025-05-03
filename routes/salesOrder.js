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
app.get('/getSalesOrder', (req, res, next) => {
  db.query(`Select s.*,
  c.first_name,
  cu.currency_name
  From sales_order s
  LEFT JOIN contact c ON (c.contact_id = s.contact_id)
  LEFT JOIN currency cu ON (cu.currency_id = s.currency_id)
  Where s.sales_order_id !=''`,
  (err, result) => {
    if (err) {
      console.log('error: ', err);
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






app.post('/getSalesorderById', (req, res, next) => {
  db.query(` Select 
  s.*,
    c.company_name,
    c.customer_code,
    c.address_street,
    c.address_town,
    c.address_state,
    c.address_country,
    c.address_po_code,
    c.phone_no,
       cd.billing_address_street,
    cd.billing_address_town,
    cd.billing_address_state,
    cd.billing_address_country,
    cd.billing_address_po_code,
    
    c.notes,
    cu.currency_id,
    cu.currency_code,
    cu.currency_name,
    cu.currency_rate,
    co.first_name AS contact_person 
  From sales_order s
   LEFT JOIN company c ON (c.company_id = s.company_id)
      LEFT JOIN company cd ON (cd.company_id = s.delivery_id)

       LEFT JOIN contact co ON (co.company_id = c.company_id)
  LEFT JOIN currency cu ON (cu.currency_id = s.currency_id)
  Where s.sales_order_id=${db.escape(req.body.sales_order_id)}`,
  (err, result) => {
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
  }
);
});



app.post('/editSalesOrder', (req, res, next) => {
  db.query(`UPDATE sales_order 
            SET contact_id=${db.escape(req.body.contact_id)}
            ,currency_id=${db.escape(req.body.currency_id)}
            ,sales_man=${db.escape(req.body.sales_man)}
            ,tran_no=${db.escape(req.body.tran_no)}
            ,tran_date=${db.escape(req.body.tran_date)}
            WHERE sales_order_id = ${db.escape(req.body.sales_order_id)}`,
            (err, result) => {
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
            }
          );
        });
  
app.post('/insertSalesOrder', (req, res, next) => {

  let data = {	
     creation_date: new Date().toISOString()
    , modification_date: null
    , contact_id: req.body.contact_id
    , currency_id	: req.body.currency_id
    , sales_man	: req.body.sales_man
    , tran_no: req.body.tran_no
    , tran_date: req.body.tran_date
    , created_by: req.body.created_by

 };
  let sql = "INSERT INTO sales_order SET ?";
  let query = db.query(sql, data, (err, result) => {
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
})
}
  }
);
});


 app.post('/getQuoteLineItemsById', (req, res, next) => {
    db.query(`SELECT
              qt.* 
             
              FROM sales_order_item qt 
              WHERE qt.sales_order_id =  ${db.escape(req.body.sales_order_id)}`,
            (err, result) => {
         
        if (err) {
          return res.status(400).send({
            msg: 'No result found'
          });
        } else {
              return res.status(200).send({
                data: result,
                msg:'Success'
              });
        }
   
      }
    );
  });
  
  app.get('/getUnitFromValueList', (req, res, next) => {
  db.query(
    `SELECT 
  value
  ,valuelist_id
  FROM valuelist WHERE key_text='UoM'`,
    (err, result) => {
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
    }
  );
});


app.post('/deleteProjectQuote', (req, res, next) => {

  let data = { sales_order_item_id: req.body. sales_order_item_id};
  let sql = "DELETE FROM  sales_order_item WHERE ?";
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


app.post("/generateInvoiceFromSalesOrder", async (req, res, next) => {
  const { sales_order_id, company_id, invoice_code } = req.body;

  if (!sales_order_id  || !invoice_code) {
    return res.status(400).send({
      msg: "sales_order_id, company_id, and invoice_code are required",
    });
  }

  try {
    // Fetch sales order items by sales_order_id
    const getSalesOrderItemsSql = `
      SELECT * FROM sales_order_item WHERE sales_order_id = ?`;
    const salesOrderItems = await new Promise((resolve, reject) => {
      db.query(getSalesOrderItemsSql, [sales_order_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (salesOrderItems.length === 0) {
      return res.status(404).send({
        msg: "No items found for the provided sales_order_id",
      });
    }

    // Calculate the total amount for the invoice
    const invoiceAmount = salesOrderItems.reduce((total, item) => total + item.amount, 0);

    const invoiceData = {
      sales_order_id,
      invoice_code,
      company_id,
      creation_date: new Date(),
      status: "Pending",
      invoice_amount: invoiceAmount, // Add the calculated total amount
    };

    // Insert invoice into the invoice table
    const createInvoiceSql = "INSERT INTO invoice SET ?";
    const invoiceResult = await new Promise((resolve, reject) => {
      db.query(createInvoiceSql, invoiceData, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const invoice_id = invoiceResult.insertId;

    // Insert each sales order item into the invoice_item table
    const insertInvoiceItemsSql = `
      INSERT INTO invoice_item (
        qty, invoice_id, unit_price, item_title, amount, unit, description, remarks
      ) VALUES ?`;

    const invoiceItemsData = salesOrderItems.map((item) => [
      item.quantity,
      invoice_id,
      item.unit_price,
      item.title,
      item.amount,
      item.unit,
      item.description,
      item.remarks,
    ]);

    await new Promise((resolve, reject) => {
      db.query(insertInvoiceItemsSql, [invoiceItemsData], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Update sales order status to 'Closed'
    const updateSalesOrderStatusSql = `
      UPDATE sales_order
      SET status = 'Closed'
      WHERE sales_order_id = ?`;

    await new Promise((resolve, reject) => {
      db.query(updateSalesOrderStatusSql, [sales_order_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return res.status(201).send({
      msg: "Invoice and items created successfully. Sales order status updated to 'Closed'.",
      invoice_id,
    });
  } catch (err) {
    console.error("Error generating invoice:", err.message);
    return res.status(500).send({
      msg: "Internal Server Error",
      error: err.message,
    });
  }
});

  
  app.post('/edit-TabQuoteLine', (req, res, next) => {
    // ... your existing code
  
    // Calculate the total_amount by summing up all line item amounts
    db.query(
      `UPDATE  sales_order_item
            SET title=${db.escape(req.body.title)}
            ,description=${db.escape(req.body.description)}
            ,quantity=${db.escape(req.body.quantity)}
            ,unit=${db.escape(req.body.unit)}
            ,unit_price=${db.escape(req.body.unit_price)}
            ,amount=${db.escape(req.body.amount)}
      
            WHERE sales_order_item_id =  ${db.escape(req.body. sales_order_item_id)}`,
            (err, result) => {
              if (err) {
                console.log("error: ", err);
                return;
              } else {
                return res.status(200).send({
                  data: result,
                  msg: "Success",
                });
              }
            }
          );
        });
    app.post('/getQuoteLineItemsById', (req, res, next) => {
    db.query(`SELECT
              qt.* 
           
              FROM sales_order_item qt 
              WHERE qt.sales_order_id =  ${db.escape(req.body.sales_order_id)}`,
            (err, result) => {
         
        if (err) {
          return res.status(400).send({
            msg: 'No result found'
          });
        } else {
              return res.status(200).send({
                data: result,
                msg:'Success'
              });
        }
   
      }
    );
  });
  
  
   app.post('/insertQuoteItems', (req, res, next) => {
    let data = {
      description: req.body.description,
      amount: req.body.amount,
    
      title: req.body.title,
      sales_order_id: req.body.sales_order_id,
   
      quantity: req.body.quantity,
    
      unit: req.body.unit,
      remarks: req.body.remarks,
    
      unit_price: req.body.unit_price,
  
    };
  
    let sql = "INSERT INTO sales_order_item SET ?";
    let query = db.query(sql, data,(err, result) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      } else {
            return res.status(200).send({
              data: result,
              msg:'New Tender has been created successfully'
            });
      }
    });
  });
  

app.post('/deleteSslesOrder', (req, res, next) => {

  let data = {sales_order_id: req.body.sales_order_id};
  let sql = "DELETE FROM sales_order WHERE ?";
  let query = db.query(sql, data, (err, result) => {
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
  }
);
});

app.get('/secret-route', userMiddleware.isLoggedIn, (req, res, next) => {
  console.log(req.userData);
  res.send('This is the secret content. Only logged in users can see that!');
});

module.exports = app;