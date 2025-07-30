import { Op } from "sequelize";

export default (req, res, next) => {
  if (req.query?.filter) {
    const filter = JSON.parse(req.query?.filter);
    const where = {};
    for (let i = 0; i < filter.length; i++) {
      switch (filter[i].type) {
        case "checkbox":
          let existActiveChip = false;
          const values = [];
          for (let j = 0; j < filter[i].chip.length; j++) {
            if (filter[i].chip[j].defaultValue) {
              existActiveChip = true;
              values.push(filter[i].chip[j].value);
            }
          }

          if (existActiveChip) {
            where[filter[i].column] = {
              [Op.or]: values,
            };
          }
          break;

        default:
          break;
      }
    }
    req.query.where = where;
  }

  next();
};
