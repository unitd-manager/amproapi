const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/Database.js");
const userMiddleware = require("../middleware/UserModel.js");
var md5 = require("md5");
const fileUpload = require("express-fileupload");
const _ = require("lodash");
const mime = require("mime-types");
var bodyParser = require("body-parser");
const fs=require('fs');
const xlsx = require('xlsx');
var cors = require("cors");
var app = express();
app.use(cors());

app.use(
  fileUpload({
    createParentPath: true,
  })
);


app.post('/ExportProducttoExcel',(req,res,next)=>{
  db.query(`SELECT *
FROM product `,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        
            let response=result;
            //create a new work book
            let workbook=xlsx.utils.book_new();
            //Converts json array to worksheet
            let worksheet=xlsx.utils.json_to_sheet(response);
            //append sheet to book
            xlsx.utils.book_append_sheet(workbook,worksheet,'Prod')
            //write file
            xlsx.writeFile(workbook,"/home/pc/Documents/Excelfiles/Product.xlsx")
            res.status(200).send({
              data: response,
              msg: 'Success',
                });
  
          }
    }
  );
});


app.get("/product/getAllPaginationProducts", (req, res) => {
  let { page = 1, limit = 20, search = "" } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  // Search filter
  let searchQuery = "";
  if (search) {
    searchQuery = `AND title LIKE ?`;
  }

  // Count total products
  const countQuery = `SELECT COUNT(*) AS total FROM products WHERE 1 ${searchQuery}`;
  const countParams = search ? [`%${search}%`] : [];

  db.query(countQuery, countParams, (err, countResult) => {
    if (err) return res.status(500).json({ error: "Database error" });

    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    // Fetch paginated products
    const query = `SELECT * FROM products WHERE 1 ${searchQuery} LIMIT ? OFFSET ?`;
    const queryParams = search ? [`%${search}%`, limit, offset] : [limit, offset];

    db.query(query, queryParams, (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      res.json({
        data: results,
        totalRecords,
        totalPages,
        currentPage: page,
      });
    });
  });
});

app.post("/getProductsPagination", (req, res, next) => {

  var limit = req.body.length;
  var start = req.body.start;
  var where = "";
  var sqlTot = "";


  // check search value exist
  if (req.body.search.value) {
    var serVal = req.body.search.value;
    where += " WHERE ";
    where += "  p.title LIKE '%" + serVal + "%' ";
    where += " OR p.item_code LIKE '%" + serVal + "%' ";
    // where += " OR ur.user_status LIKE '%" + serVal + "%' ";
  }
  // getting total number records without any search
  var sql = `SELECT DISTINCT p.*
  ,c.category_title
  FROM product p LEFT JOIN (category c) ON (p.category_id = c.category_id)`;
  
  sqlTot = sql;

  //concatenate search sql if value exist
  if (where && where !== "") {
   
      sqlTot = `SELECT DISTINCT p.*
  ,c.category_title
  FROM product p LEFT JOIN (category c) ON (p.category_id = c.category_id) ${where}`;
   
    sql =  `SELECT DISTINCT p.*
  ,c.category_title
  FROM product_pagination p LEFT JOIN (category c) ON (p.category_id = c.category_id) ${where} LIMIT ${start} ,${limit}`;  
    
  }
    sql =  `SELECT DISTINCT p.*
  ,c.category_title
  FROM product p LEFT JOIN (category c) ON (p.category_id = c.category_id) LIMIT ${start} ,${limit}`;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(400).send({
        data: err,
        msg: "failed",
      });
    } else {
        let finalData = result
      db.query(sqlTot, (err, result) => {
        if (err) {
          return res.status(400).send({
            data: err,
            msg: "failed",
          });
        } else {
          return res.status(200).send({
            msg: "Success",
            draw: req.body.draw,
            recordsTotal: 20,
            recordsFiltered: result.length,
            data: finalData
          });
        }
      });
    }
  });
});

app.get("/getColorValueList", (req, res, next) => {
  db.query(
    `SELECT 
       value as colors,valuelist_id
       FROM valuelist WHERE key_text="Product Color"`,
    (err, result) => {
      if (err) {
        return res.status(400).send({
          data: err
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.get("/getSizeValueList", (req, res, next) => {
  db.query(
    `SELECT 
       value,valuelist_id
       FROM valuelist WHERE key_text="Product Size"`,
    (err, result) => {
      if (err) {
        return res.status(400).send({
          data: err
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.get("/getAllProducts", (req, res, next) => {
  db.query(
    `select  p.title
     ,p.category_id
      ,p.product_code
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,p.tag
    ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id)
     where p.product_id !=''
   GROUP BY p.product_id `,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});



app.get("/getOfferProducts", (req, res, next) => {
  db.query(
    `select  p.title
     ,p.category_id
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id)
     where p.discount_percentage !=''
   GROUP BY p.product_id `,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.get("/getTopOfferProducts", (req, res, next) => {
  db.query(
    `select  p.title
     ,p.category_id
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id)
     where p.discount_percentage !=''
   GROUP BY p.product_id 
   ORDER BY p.discount_percentage DESC`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});



app.get("/getLTHProducts", (req, res, next) => {
  db.query(
    `SELECT * 
    ,GROUP_CONCAT(m.file_name) AS images
    FROM product p 
    LEFT JOIN media m ON (p.product_id = m.record_id)
    where p.product_id !=''
   GROUP BY p.product_id
   ORDER BY p.price ASC LIMIT 3`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.post("/getProductBySubcategory", (req, res, next) => {
  db.query(
    `select p.title
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,sc.sub_category_id
    ,sc.title
    from product p
     LEFT JOIN sub_category sc ON (c.sub_category_id = p.sub_category_id)
     where p.sub_category_id= ${db.escape(req.body.sub_category_id)}`,
    (err, result) => {
      if (err) {
        return res.status(400).send({
          data: err,
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.post("/getProductbyproductId", (req, res, next) => {
  db.query(
    `SELECT p.title
    ,p.product_id
    ,p.sub_category_id
    ,p.category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,p.tag
     ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id)
    where p.product_id= ${db.escape(req.body.product_id)} 
     GROUP BY p.product_id`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.post("/getProductbyCategoryId", (req, res, next) => {
  db.query(
    `SELECT p.title
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
     ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id) 
    where p.category_id= ${db.escape(req.body.category_id)}
     GROUP BY p.product_id`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.post("/getProductsbyTag", (req, res, next) => {
  db.query(
    `SELECT p.title
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,p.tag
     ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id)
    where p.tag = ${db.escape(req.body.tag)}
     GROUP BY p.product_id`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.get("/getMostPopularProducts", (req, res, next) => {
  db.query(
    `SELECT p.title
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,p.tag
     ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id)
    where p.most_popular !=''
     GROUP BY p.product_id`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.get("/getBestSellingProducts", (req, res, next) => {
  db.query(
    `SELECT p.title
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,p.tag
     ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id)
    where p.top_seller !=''
     GROUP BY p.product_id`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.get("/getNewProducts", (req, res, next) => {
  db.query(
    `SELECT p.title
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,p.tag
     ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id)
    where p.latest != ''
     GROUP BY p.product_id`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.post("/getProductsbySearch", (req, res, next) => {
  db.query(
    `SELECT p.title
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id)
    where p.title LIKE CONCAT('%', ${db.escape(req.body.keyword)}, '%') 
     GROUP BY p.product_id`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.post("/getOffersProductsbySearch", (req, res, next) => {
  db.query(
    `SELECT p.title
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id) 
    where p.discount_percentage !='' AND p.title LIKE CONCAT('%', ${db.escape(req.body.keyword)}, '%') 
     GROUP BY p.product_id`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.get("/getProducts", (req, res, next) => {
  db.query(
    `SELECT DISTINCT p.product_id
  ,p.category_id
  ,p.sub_category_id
  ,p.title AS product_name
  ,p.description,
  p.qty_in_stock
  ,p.price
  ,p.published
  ,p.creation_date
  ,p.modification_date
  ,p.description_short
  ,p.general_quotation
  ,p.unit
  ,p.product_group_id
  ,p.item_code
  ,p.modified_by
  ,p.created_by
  ,p.part_number
  ,p.price_from_supplier
  ,p.latest
  ,p.section_id
  ,p.hsn
  ,p.gst
  ,p.mrp
  ,p.tag_no
  ,p.product_type
  ,p.bar_code
  ,p.product_code
  ,p.discount_type
  ,p.discount_percentage
  ,p.discount_amount
  ,p.discount_from_date
  ,p.discount_to_date
  ,p.tag
   ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id)
    where p.product_id != ''
     GROUP BY p.product_id `,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.get("/getProductAdmin", (req, res, next) => {
  db.query(
    `SELECT DISTINCT p.product_id
  ,p.category_id
  ,p.alternative_product_name 
  ,p.purchase_unit_cost 	
  ,p.sub_category_id
  ,p.title
  ,p.description
  ,p.qty_in_stock
  ,p.price
  ,p.published
  ,p.creation_date
  ,p.modification_date
  ,p.description_short
  ,p.general_quotation
  ,p.unit
  ,p.product_group_id
  ,p.item_code
  ,p.modified_by
  ,p.created_by
  ,p.part_number
  ,p.price_from_supplier
  ,p.latest
  ,p.section_id
  ,p.hsn
  ,p.gst
  ,p.mrp
  ,p.tag_no
  ,p.product_type
  ,p.bar_code
  ,p.product_code
  ,p.discount_type
  ,p.discount_percentage
  ,p.discount_amount
  ,p.discount_from_date
  ,p.discount_to_date
  ,p.tag
  ,p.ecommerce_price
  ,p.retail_price
  ,p.wholesale_price
  ,p.department_id
  ,p.unit
  ,p.part_number 
  ,p.carton_price
  ,p.carton_qty
  ,p.loose_qty
  ,p.department_id
  ,p.supplier_id
  ,d.department_name
  ,s.company_name
  ,i.inventory_id
   ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id) 
     LEFT JOIN inventory i ON p.product_id = i.product_id
     LEFT JOIN department d ON d.department_id = p.department_id
     LEFT JOIN supplier s  ON s.supplier_id = p.supplier_id
    where p.product_id != ''
     GROUP BY p.product_id `,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.post("/getProductCategoryTitle", (req, res, next) => {
  db.query(
    `SELECT p.title
    ,p.category_id
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,p.tag
    ,c.category_title
     ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN category c ON p.category_id = c.category_id
     LEFT JOIN media m ON (p.product_id = m.record_id) 
    where c.category_id = ${db.escape(req.body.category_id)} 
     GROUP BY p.product_id`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
})

app.post("/getProduct", (req, res, next) => {
  db.query(
    `SELECT p.title
    ,p.category_id
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.alternative_product_name
    ,p.brand
    ,p.keyword_search
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    ,p.tag
    ,p.ecommerce_price
    ,p.retail_price
  ,p.wholesale_price
  ,p.department_id
  ,p.unit
  ,p.part_number 
  ,p.carton_price
  ,p.carton_qty
  ,p.department_id
  ,p.sub_category_id
  ,p.brand_id
  ,p.display_order
  ,p.purchase_uom
  ,p.sales_uom
  ,p.pcs_per_carton
  ,p.product_weight 
  ,p.purchase_unit_cost
  ,p.operation_cost
  ,p.min_retail_price
  ,p.min_wholesale_price
  ,p.min_carton_price
  ,p.style_fabric
  ,p.carton_weight
  ,p.m3_per_carton
  ,p.bin
  ,p.remarks
  ,p.show_on_purchase
  ,p.show_on_sales
  ,p.is_active
  ,p.eprocurement
  ,p.ecommerce
  ,p.show_on_pos
  ,p.tax_percentage
  ,p.model_no
  ,b.brand_name
  ,s.sub_category_title
  ,d.department_name
    ,p.created_by
    ,p.modified_by
     ,GROUP_CONCAT(m.file_name) AS images
    from product p
     LEFT JOIN media m ON (p.product_id = m.record_id)
     LEFT JOIN department d ON (d.department_id = p.department_id)
     LEFT JOIN brand b ON (b.brand_id = p.brand_id)
     LEFT JOIN sub_category s ON (s.sub_category_id = p.sub_category_id)
    where p.product_id = ${db.escape(req.body.product_id)}
     GROUP BY p.product_id`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
})

app.post("/getPoProduct", (req, res, next) => {
  db.query(
    `SELECT p.title
    ,p.product_id
    ,p.sub_category_id
    ,p.product_code
    ,p.description
    ,p.qty_in_stock
    ,p.price
    ,p.published
    ,p.member_only
    ,p.creation_date
    ,p.modification_date
    ,p.chi_title
    ,p.product_description
    ,p.sort_order
    ,p.meta_title
    ,p.meta_description
    ,p.meta_keyword
    ,p.latest
    ,p.description_short
    ,p.chi_description_short
    ,p.general_quotation
    ,p.unit
    ,p.product_group_id
    ,p.department_id
    ,p.item_code
    ,p.modified_by
    ,p.created_by
    ,p.part_number
    ,p.price_from_supplier
    ,p.model
    ,p.carton_no
    ,p.batch_no
    ,p.vat
    ,p.fc_price_code
    ,p.batch_import
    ,p.commodity_code
    ,p.show_in_website
    ,p.most_selling_product
    ,p.site_id
    ,p.damaged_qty
    ,p.item_code_backup
    ,p.hsn_sac
    ,p.deals_of_week
    ,p.top_seller
    ,p.hot_deal
    ,p.most_popular
    ,p.top_rating
    ,p.section_id
    ,p.discount_type
    ,p.discount_percentage
    ,p.discount_amount
    ,p.hsn
    ,p.gst
    ,p.product_weight
    ,p.supplier_id
    ,p.product_type
    ,p.bar_code
    ,p.tag_no
    ,p.pack_size
    ,p.discount_from_date
    ,p.discount_to_date
    ,p.mrp
    ,p.raw_material
    ,p.sales_part_number
    ,p.igst
    FROM product p where p.product_id = ${db.escape(req.body.product_id)} `,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  )
});




app.post("/getProductColor", (req, res, next) => {
  db.query(
    `SELECT p.product_id
    ,p.product_color
    ,p.stock_quantity
    ,p.creation_date
    ,p.modification_date
    ,p.product_color_id
    FROM product_color p where p.product_id = ${db.escape(req.body.product_id)} `,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  )
});


app.post("/edit-Product", (req, res, next) => {
  db.query(
    `UPDATE product 
            SET title=${db.escape(req.body.title)}
            ,published=${db.escape(req.body.published)}
             ,most_popular=${db.escape(req.body.most_popular)}
              ,discount_percentage=${db.escape(req.body.discount_percentage)}
              ,top_seller=${db.escape(req.body.top_seller)}
              ,latest=${db.escape(req.body.latest)}
            ,category_id=${db.escape(req.body.category_id)}
            ,product_type=${db.escape(req.body.product_type)}
            ,price=${db.escape(req.body.price)}
            ,qty_in_stock=${db.escape(req.body.qty_in_stock)}
           ,unit=${db.escape(req.body.unit)}
            ,alternative_product_name=${db.escape(req.body.alternative_product_name)}
            ,brand_id=${db.escape(req.body.brand_id)}
           ,keyword_search=${db.escape(req.body.keyword_search)}
            ,gst=${db.escape(req.body.gst)}
            ,description_short=${db.escape(req.body.description_short)}
            ,description=${db.escape(req.body.description)}
            ,product_description=${db.escape(req.body.product_description)}
            ,modification_date=${db.escape(req.body.modification_date)}
            ,modified_by=${db.escape(req.body.modified_by)}
            ,tag=${db.escape(req.body.tag)}
            ,operation_cost=${db.escape(req.body.operation_cost)}
            ,min_retail_price=${db.escape(req.body.min_retail_price)}
             ,min_wholesale_price=${db.escape(req.body.min_wholesale_price)}
              ,min_carton_price=${db.escape(req.body.min_carton_price)}
              ,style_fabric=${db.escape(req.body.style_fabric)}
              ,carton_weight=${db.escape(req.body.carton_weight)}
            ,m3_per_carton=${db.escape(req.body.m3_per_carton)}
            ,bin=${db.escape(req.body.bin)}
            ,remarks=${db.escape(req.body.remarks)}
            ,show_on_purchase=${db.escape(req.body.show_on_purchase)}
           ,show_on_sales=${db.escape(req.body.show_on_sales)}
            ,is_active=${db.escape(req.body.is_active)}
            ,eprocurement=${db.escape(req.body.eprocurement)}
            ,ecommerce=${db.escape(req.body.ecommerce)}
           ,show_on_pos=${db.escape(req.body.show_on_pos)}
            ,tax_percentage=${db.escape(req.body.tax_percentage)}
            ,carton_price=${db.escape(req.body.carton_price)}
            ,model_no=${db.escape(req.body.model_no)}
            ,modification_date=${db.escape(req.body.modification_date)}
            ,modified_by=${db.escape(req.body.modified_by)}
            ,purchase_uom=${db.escape(req.body.purchase_uom)}
            ,sales_uom=${db.escape(req.body.sales_uom)}
            ,pcs_per_carton=${db.escape(req.body.pcs_per_carton)}
            ,purchase_unit_cost=${db.escape(req.body.purchase_unit_cost)}
            ,retail_price=${db.escape(req.body.retail_price)}
            ,wholesale_price=${db.escape(req.body.wholesale_price)}
            ,sub_category_id=${db.escape(req.body.sub_category_id)}
            ,department_id=${db.escape(req.body.department_id)}
            ,supplier_id=${db.escape(req.body.supplier_id)}
            ,display_order=${db.escape(req.body.display_order)}
            ,pcs_per_carton=${db.escape(req.body.pcs_per_carton)}
            ,product_weight=${db.escape(req.body.product_weight)}
            WHERE product_id =  ${db.escape(req.body.product_id)}`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.post("/editInventoryProduct", (req, res, next) => {
  db.query(
    `UPDATE product 
            SET qty_in_stock=${db.escape(req.body.qty_in_stock)}
            WHERE product_id =  ${db.escape(req.body.product_id)}`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.post("/edit-ProductQty", (req, res, next) => {
  db.query(
    `UPDATE product 
            SET qty_in_stock=${db.escape(req.body.qty_in_stock)}
            ,modification_date=${db.escape(new Date())}
            ,modified_by=${db.escape(req.user)}
            WHERE product_id =  ${db.escape(req.body.product_id)}`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.post("/editProductColor", (req, res, next) => {
  db.query(
    `UPDATE product_color 
            SET product_id=${db.escape(req.body.product_id)}
            ,product_color=${db.escape(req.body.product_color)}
            ,stock_quantity=${db.escape(req.body.stock_quantity)}
            ,creation_date=${db.escape(req.body.creation_date)}
            ,modification_date=${db.escape(req.body.modification_date)}
            WHERE product_color_id =  ${db.escape(req.body.product_color_id)}`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.post("/editProductSize", (req, res, next) => {
  db.query(
    `UPDATE product_size
            SET product_id=${db.escape(req.body.product_id)}
            ,product_size=${db.escape(req.body.product_size)}
            ,stock_quantity=${db.escape(req.body.stock_quantity)}
            ,creation_date=${db.escape(req.body.creation_date)}
            ,modification_date=${db.escape(req.body.modification_date)}
            WHERE product_size_id =  ${db.escape(req.body.product_size_id)}`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.post('/update-Publish', (req, res, next) => {
  db.query(`UPDATE product 
            SET published=${db.escape(req.body.published)}
            WHERE product_id =  ${db.escape(req.body.product_id)}`,
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


app.post('/insertProduct', (req, res, next) => {

  let data = {category_id: req.body.category_id
    ,  sub_category_id : req.body. sub_category_id 
    , title: req.body.title
    , product_code: req.body.product_code
    , description: req.body.description
    , qty_in_stock: req.body.qty_in_stock
    , price: req.body.price
    , published:1
    , member_only: req.body.member_only
    , creation_date: new Date()
    , modification_date: req.body.modification_date
    , chi_title: req.body.chi_title
    , product_description: req.body.product_description
    , sort_order: req.body.sort_order
    , meta_title: req.body.meta_title
    , meta_description: req.body.meta_description
    , meta_keyword: req.body.meta_keyword
    , latest : req.body. latest 
    , description_short: req.body.description_short
    , general_quotation: req.body.general_quotation
    , unit: req.body.unit
    , product_group_id: req.body.product_group_id
    , department_id: req.body.department_id
    , item_code: req.body.item_code
    , modified_by: req.body.modified_by
    , created_by: req.body.created_by
    , part_number: req.body.part_number
    , price_from_supplier: req.body.price_from_supplier
    , model: req.body.model
    , carton_no: req.body.carton_no
    , batch_no: req.body.batch_no
    , vat: req.body.vat
    , fc_price_code: req.body.fc_price_code
    , batch_import: req.body.batch_import
    , commodity_code: req.body.commodity_code
    , show_in_website: req.body.show_in_website
    , most_selling_product: req.body.most_selling_product
    , site_id: req.body.site_id
    , damaged_qty: req.body.damaged_qty
    , item_code_backup: req.body.item_code_backup
    , hsn_sac: req.body.hsn_sac
    , deals_of_week: req.body.deals_of_week
    , top_seller: req.body.top_seller
    , hot_deal: req.body.hot_deal
    , most_popular : req.body. most_popular 
    , top_rating: req.body.top_rating
    , section_id: req.body.section_id
    , discount_type: req.body.discount_type
    , discount_percentage: req.body.discount_percentage
    , discount_amount: req.body.discount_amount
    , hsn: req.body.hsn
    , gst: req.body.gst
    , product_weight: req.body.product_weight
    , supplier_id: req.body.supplier_id
    , product_type: req.body.product_type
    , bar_code: req.body.bar_code
    , tag_no: req.body.tag_no
    , pack_size : req.body. pack_size 
    , discount_from_date: req.body.discount_from_date
    , tag : req.body. tag 
    , discount_to_date: req.body.discount_to_date
    , mrp: req.body.mrp
    , show_on_purchase: 0
    , show_on_sales : 0
    , is_active: 0
    , eprocurement : 0 
    , ecommerce: 0
    , show_on_pos: 0
  };
  let sql = "INSERT INTO product SET ?";
  let query = db.query(sql, data, (err, result) => {
    if (err) {
      console.log("error: ", err);
      return res.status(400).send({
        data: err,
        msg: "failed",
      });
    } else {
      return res.status(200).send({
        data: result,
        msg: "Success",
      });
    }
  });
});

app.post("/deleteProduct", (req, res, next) => {
  let data = { product_id: req.body.product_id };
  let sql = "DELETE FROM product WHERE ?";
  let query = db.query(sql, data, (err, result) => {
    if (err) {
      console.log("error: ", err);
      return res.status(400).send({
        data: err,
        msg: "failed",
      });
    } else {
      return res.status(200).send({
        data: result,
        msg: "Success",
      });
    }
  });
});

app.post('/insertProductColor', (req, res, next) => {

  let data = {product_color_id : req.body.product_color_id 
    ,  product_id : req.body. product_id 
    , product_color: req.body.product_color
    , stock_quantity: req.body.stock_quantity
    , creation_date: req.body.creation_date
    , modification_date: req.body.modification_date
      
  };
  let sql = "INSERT INTO product_color SET ?";
  let query = db.query(sql, data, (err, result) => {
    if (err) {
      console.log("error: ", err);
      return res.status(400).send({
        data: err,
        msg: "failed",
      });
    } else {
      return res.status(200).send({
        data: result,
        msg: "Success",
      });
    }
  });
});

app.post("/deleteProductColor", (req, res, next) => {
  let data = { product_color_id: req.body.product_color_id };
  let sql = "DELETE FROM product_color WHERE ?";
  let query = db.query(sql, data, (err, result) => {
    if (err) {
      console.log("error: ", err);
      return res.status(400).send({
        data: err,
        msg: "failed",
      });
    } else {
      return res.status(200).send({
        data: result,
        msg: "Success",
      });
    }
  });
});


app.post('/insertProductSize', (req, res, next) => {

  let data = {product_size_id : req.body.product_size_id 
    ,  product_id : req.body. product_id 
    , product_size: req.body.product_size
    , stock_quantity: req.body.stock_quantity
    , creation_date: req.body.creation_date
    , modification_date: req.body.modification_date
  };
  let sql = "INSERT INTO product_size SET ?";
  let query = db.query(sql, data, (err, result) => {
    if (err) {
      console.log("error: ", err);
      return res.status(400).send({
        data: err,
        msg: "failed",
      });
    } else {
      return res.status(200).send({
        data: result,
        msg: "Success",
      });
    }
  });
});

app.post("/deleteProductSize", (req, res, next) => {
  let data = { product_size_id: req.body.product_size_id };
  let sql = "DELETE FROM product_size WHERE ?";
  let query = db.query(sql, data, (err, result) => {
    if (err) {
      console.log("error: ", err);
      return res.status(400).send({
        data: err,
        msg: "failed",
      });
    } else {
      return res.status(200).send({
        data: result,
        msg: "Success",
      });
    }
  });
});

app.get("/getCategory", (req, res, next) => {
  db.query(
    `SELECT category_id
  ,category_title
  FROM category 
  WHERE category_id !='' `,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.get("/getSubCategory", (req, res, next) => {
  db.query(
    `SELECT sub_category_id
  ,sub_category_title
  FROM sub_category 
  WHERE sub_category_id !='' `,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.get("/getBrand", (req, res, next) => {
  db.query(
    `SELECT brand_id
  ,brand_name
  FROM brand 
  WHERE brand_id !='' `,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.get("/getDepartment", (req, res, next) => {
  db.query(
    `SELECT department_id
  ,department_name
  FROM department 
  WHERE department_id !='' `,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.get("/getSupplier", (req, res, next) => {
  db.query(
    `SELECT supplier_id
  ,company_name
  FROM supplier 
  WHERE supplier_id !='' `,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});


app.get("/getMaxItemCode", (req, res, next) => {
  db.query(
    `SELECT MAX (item_code) As itemc
  FROM product
  WHERE product_id !=''`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.post("/EditCSProductLineItems", (req, res, next) => {
  db.query(
    `UPDATE cs_product 
            SET contact_id=${db.escape(req.body.contact_id)}
            ,supplier_id=${db.escape(req.body.supplier_id)}
             ,updated_at =${db.escape(req.body.updated_at )}
              ,wholesale_price=${db.escape(req.body.wholesale_price)}
              ,carton_price=${db.escape(req.body.carton_price)}
              ,fixed_price=${db.escape(req.body.fixed_price)}
            WHERE contact_id =  ${db.escape(req.body.contact_id)}`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.post("/getCSSupplierProductByProductId", (req, res, next) => {
  db.query(
    `SELECT
    * from cs_product
    where product_id = ${db.escape(req.body.product_id)} AND supplier_id!=''`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.post("/getCSCustomerProductByProductId", (req, res, next) => {
  db.query(
    `SELECT
    * from cs_product
    where product_id = ${db.escape(req.body.product_id)} AND contact_id !=''`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});

app.post("/EditCSProductLineItemsBYSupplierID", (req, res, next) => {
  db.query(
    `UPDATE cs_product 
            SET contact_id=${db.escape(req.body.contact_id)}
            ,supplier_id=${db.escape(req.body.supplier_id)}
             ,updated_at =${db.escape(req.body.updated_at )}
              ,wholesale_price=${db.escape(req.body.wholesale_price)}
              ,carton_price=${db.escape(req.body.carton_price)}
              ,fixed_price=${db.escape(req.body.fixed_price)}
            WHERE supplier_id =  ${db.escape(req.body.supplier_id)}`,
    (err, result) => {
      if (err) {
        console.log("error: ", err);
        return res.status(400).send({
          data: err,
          msg: "failed",
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: "Success",
        });
      }
    }
  );
});



app.get("/secret-route", userMiddleware.isLoggedIn, (req, res, next) => {
  console.log(req.userData);
  res.send("This is the secret content. Only logged in users can see that!");
});

module.exports = app;
