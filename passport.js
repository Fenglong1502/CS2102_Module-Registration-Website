const passport = require('passport');
const pool = require('./database');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;

module.exports = function (passport) {
    passport.use(new LocalStrategy({ usernameField: 'nusnetid' }, function (nusnetid, password, done) {

        findUser(nusnetid, (err, user) => {
            if (err) {
                console.log('testing');
                return done(err);
            }
            if (!user) {
                console.error('User not found');
                console.log('User not found');
                return done(null, false);
            }
            bcrypt.compare(password, user.hashedPassword, (err, isValid) => {
                if (err) {
                    console.log('testing2');
                    console.log(err);
                    console.log(user.hashedPassword);
                    console.log(password);

                    return done(err);
                }
                if (!isValid) {
                    console.log('testing3');
                    return (null, false);
                }
                return done(null, user);
            })
        })
    }));
}


function findUser(nusnetid, callback) {
    const sql = 'SELECT *, (SELECT true FROM student s WHERE s.nusnetid = u.nusnetid) AS student, (SELECT true FROM admin a WHERE a.nusnetid = u.nusnetid) AS admin FROM users u WHERE LOWER(nusnetid) = $1'
    const params = [nusnetid.toLowerCase()];
    pool.query(sql, params, (error, result) => {
        if (error) {
            console.log('err: ', error);
            return callback(null);
        }

        if (result.rows.length == 0) {
            console.error("User does not exist");
            return callback(null);
        }
        else if (result.rows.length == 1) {
            return callback(null, {
                nusnetid: result.rows[0].nusnetid,
                hashedPassword: result.rows[0].password,
                fname: result.rows[0].fname,
                lname: result.rows[0].lname,
                isStudent:  result.rows[0].student,
                isAdmin:  result.rows[0].admin,
                ay: "19/20",
                sem: 1,
                round: 1
            })
        } else {
            console.error("More than one user");
            return callback(null);
        }
    });
}

passport.serializeUser(function (user, cb) {
    cb(null, user.nusnetid);
});

passport.deserializeUser(function (nusnetid, cb) {
    findUser(nusnetid, cb);
});


