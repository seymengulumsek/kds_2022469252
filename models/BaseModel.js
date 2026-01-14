

const db = require('../config/database');

class BaseModel {
    constructor(tableName, primaryKey = 'id') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
    }


    async getAll() {
        const sql = `SELECT * FROM ${this.tableName}`;
        try {
            const [rows] = await db.pool.query(sql);
            return rows;
        } catch (error) {
            console.error(`${this.tableName}.getAll error:`, error.message);
            return [];
        }
    }


    async getById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        try {
            const [rows] = await db.pool.query(sql, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error(`${this.tableName}.getById error:`, error.message);
            return null;
        }
    }


    async insert(data) {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
        try {
            const [result] = await db.pool.query(sql, values);
            return { success: true, insertId: result.insertId };
        } catch (error) {
            console.error(`${this.tableName}.insert error:`, error.message);
            return { success: false, error: error.message };
        }
    }


    async update(id, data) {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];
        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
        try {
            const [result] = await db.pool.query(sql, values);
            return { success: true, affectedRows: result.affectedRows };
        } catch (error) {
            console.error(`${this.tableName}.update error:`, error.message);
            return { success: false, error: error.message };
        }
    }


    async delete(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
        try {
            const [result] = await db.pool.query(sql, [id]);
            return { success: true, affectedRows: result.affectedRows };
        } catch (error) {
            console.error(`${this.tableName}.delete error:`, error.message);
            return { success: false, error: error.message };
        }
    }


    async filter(conditions = {}) {
        let sql = `SELECT * FROM ${this.tableName}`;
        const values = [];

        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
            sql += ` WHERE ${whereClause}`;
            values.push(...Object.values(conditions));
        }

        try {
            const [rows] = await db.pool.query(sql, values);
            return rows;
        } catch (error) {
            console.error(`${this.tableName}.filter error:`, error.message);
            return [];
        }
    }


    async query(sql, params = []) {
        try {
            const [rows] = await db.pool.query(sql, params);
            return rows;
        } catch (error) {
            console.error(`${this.tableName}.query error:`, error.message);
            return [];
        }
    }
}

module.exports = BaseModel;
