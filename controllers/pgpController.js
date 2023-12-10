const openpgp = require("openpgp");
const getUserIdFromToken = require("../utils/getUserIdFromToken");

const db = require("../models");
const User = db.User;
const Role = db.Role;
const PGPKey = db.PGPKey;

exports.renderAddPGPKey = async (req, res) => {
  const userId = getUserIdFromToken(req);

  const user = await User.findByPk(userId, {
    include: [
      {
        model: PGPKey,
      },
    ],
  });

  const role = await Role.findOne({ where: { id: user.roleId } });

  res.render("users/settings/add-pgp-key", {
    user: user,
    role: role,
    flash: req.flash(),
  });
};

exports.addPGPKey = async (req, res) => {
  // Get the PGP key from the form
  const pgpKey = req.body.pgp_key;
  try {
    const key = await openpgp.readKey({ armoredKey: pgpKey });
    const keyIsValid = key.keyPacket.version > 0;

    if (!keyIsValid) {
      req.flash("Invalid PGP key format.");
      res.redirect("/pgp/add-pgp-key");
      return;
    } else {
      // Check if the key already exists
      const existingKey = await PGPKey.findOne({ where: { key: pgpKey } });

      if (existingKey) {
        req.flash("error", "This PGP key is already in use by another user. Please use a different key.");
        res.redirect("/pgp/add-pgp-key");
      } else {
        const userId = getUserIdFromToken(req);

        const user = await User.findByPk(userId);

        // Generate an UUID for the newly created user
        const uuid = require("uuid");
        const pgpKeyId = uuid.v4();

        // Create a new pgp key
        const newPGPKey = await PGPKey.create({ id: pgpKeyId, key: pgpKey });

        // Associate the PGPKey with the user
        await user.setPGPKey(newPGPKey);

        req.flash("success", "PGP key added successfully.");
        res.redirect("/pgp/add-pgp-key");
      }
    }
  } catch (error) {
    console.log(error);
    req.flash("error", "Invalid PGP key format. Please try again.");
    res.redirect("/pgp/add-pgp-key");
    return;
  }
};

exports.deletePGPKey = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const pgpKey = await PGPKey.findOne({ where: { user_id: userId } });

    await pgpKey.destroy();

    req.flash("success", "PGP key deleted successfully. You can now add a new one.");
    res.redirect("/pgp/add-pgp-key");
  } catch (error) {
    req.flash("error", "Error deleting PGP key. Please try again.");
    res.redirect("/pgp/add-pgp-key");
    return;
  }
};
