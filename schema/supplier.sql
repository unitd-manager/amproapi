ALTER TABLE `sales_order` ADD `order_no` VARCHAR(255) NULL DEFAULT NULL AFTER `bill_discount`, ADD `gst_reg_no` VARCHAR(255) NULL DEFAULT NULL AFTER `order_no`; 
ALTER TABLE `sales_order` ADD `terms` VARCHAR(255) NULL DEFAULT NULL AFTER `gst_reg_no`; 
ALTER TABLE `supplier` ADD `price_group` VARCHAR(255) NULL DEFAULT NULL AFTER `address2`, ADD `tax` VARCHAR(255) NULL DEFAULT NULL AFTER `price_group`, ADD `contact_type` VARCHAR(255) NULL DEFAULT NULL AFTER `tax`, ADD `currency` VARCHAR(255) NULL DEFAULT NULL AFTER `contact_type`, ADD `area` VARCHAR(255) NULL DEFAULT NULL AFTER `currency`, ADD `company_reg_no` VARCHAR(255) NULL DEFAULT NULL AFTER `area`, ADD `hand_phone_no` VARCHAR(255) NULL DEFAULT NULL AFTER `company_reg_no`;
ALTER TABLE `sales_order_item` ADD `foc` INT(11) NULL DEFAULT NULL AFTER `wholesale_price`; 
ALTER TABLE `sales_order_item` CHANGE `foc` `foc` DECIMAL(10,2) NULL DEFAULT NULL; 
ALTER TABLE `supplier` ADD `user_name` VARCHAR(255) NULL DEFAULT NULL AFTER `cheque_print_name`, ADD `password` VARCHAR(255) NULL DEFAULT NULL AFTER `user_name`;
ALTER TABLE `contact` ADD `supplier_id` INT(11) NULL DEFAULT NULL AFTER `modified_by`; 
ALTER TABLE `contact` ADD `hand_phone_no` INT(50) NULL DEFAULT NULL AFTER `supplier_id`;  