import { Roles } from "../models";

//----------------<< Create Role >>----------------
export async function createRole(req, res, next) {
  try {
    const newRole = await Roles.create(req.body);
    res.status(201).send({
      status: "success",
      message: res.__("roles.roleCreate"),
      data: newRole,
    });
  } catch (error) {
    next(error);
  }
}

//----------------<< Get All Roles >>----------------
export async function getRoles(req, res, next) {
  let query = {};
  try {
    let limit = req?.query?.limit ? Number(req.query.limit) : 10;
    if (req.query?.page) {
      query["limit"] = limit;
      query["offset"] = (Number(req.query.page) - 1) * limit;
    }

    let order = req.query?.order ? req.query?.order : "desc";

    if (req.query?.orderBy) {
      query["order"] = [[req.query?.orderBy, order]];
    } else {
      query["order"] = [["id", order]];
    }

    query['distinct'] = true
    let roles = await Roles.findAndCountAll(query);
    let dataCount = roles.count
    roles = roles.rows.map((role) => ({
      ...role.toJSON(),
      accessId: Array.isArray(role.accessId)
        ? role.accessId
        : role.accessId
        ? JSON.parse(role.accessId)
        : [],
    }));

    res.status(200).send({
      status: "success",
      count : dataCount,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
}

//-----------------<< Get Role By ID >>----------------
export async function getRoleById(req, res, next) {
  try {
    let role = await Roles.findByPk(req.params.id);
    role = {
      ...role.toJSON(),
      accessId: Array.isArray(role.accessId)
        ? role.accessId
        : role.accessId
        ? JSON.parse(role.accessId)
        : [],
    };
    if (!role) {
      return res.status(404).send({
        status: "error",
        message: res.__("roles.roleNo"),
      });
    }
    res.status(200).send({
      status: "success",
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

//-----------------<< Update Role >>----------------
export async function updateRole(req, res, next) {
  try {
    const [updated] = await Roles.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated) {
      return res.status(404).send({
        status: "error",
        message: res.__("roles.roleNo"),
      });
    }
    const updatedRole = await Roles.findByPk(req.params.id);
    res.status(200).send({
      status: "success",
      data: updatedRole,
    });
  } catch (error) {
    next(error);
  }
}

//-----------------<< Delete Role >>----------------
export async function deleteRole(req, res, next) {
  try {
    const deleted = await Roles.destroy({
      where: { id: req.params.id },
    });
    if (!deleted) {
      return res.status(404).send({
        status: "error",
        message: res.__("roles.roleNo"),
      });
    }
    res.status(200).send({
      status: "success",
      message: res.__("roles.roleDelete"),
    });
  } catch (error) {
    next(error);
  }
}

//===================================<<> Bulk Delete Api >>=========================
export async function bulkDelete(req, res) {
  try {
    let { ids } = req.body;
    Roles.destroy({
      where: {
        id: ids,
      },
    });

    return res.status(200).send({
      status: "success",
      message: res.__("bulk.success"),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: "error",
      message: res.__("bulk.500error"),
    });
  }
}
