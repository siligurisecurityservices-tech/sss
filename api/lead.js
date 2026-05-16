const { handleLead } = require("./_lib/lead.js");

module.exports = async function (req, res) {
  return handleLead(req, res, { kind: "quote", requireLocation: true });
};
