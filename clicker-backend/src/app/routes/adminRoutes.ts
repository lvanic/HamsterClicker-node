import Router from "@koa/router";
import * as adminController from "../controllers/adminController";

const router = new Router({
  prefix: "/admin",
});

router.get("/settings", adminController.getAppSettings);
router.post("/settings", adminController.updateAppSettings);

router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);

router.get("/tasks", adminController.getTasks);
router.post("/tasks/:id/deactivate", adminController.deactivateTask);
router.post("/tasks/:id/activate", adminController.activateTask);
router.post("/tasks", adminController.addTask);
router.get("/tasks/:id", adminController.getTaskById);
router.put("/tasks/:id", adminController.updateTask);

router.get("/leagues", adminController.getLeagues);
router.post("/leagues", adminController.addLeague);
router.delete("/leagues/:id", adminController.deleteLeague);
router.get("/leagues/:id", adminController.getLeagueById);
router.put("/leagues/:id", adminController.updateLeague);

router.get("/businesses", adminController.getBusinesses);
router.get("/businesses/:id", adminController.getBusinessById);
router.post("/businesses", adminController.addBusiness);
router.delete("/businesses/:id", adminController.deleteBusiness);
router.put("/businesses/:id", adminController.updateBusiness);

router.get("/reset-users", adminController.resetUsers);

router.post("/broadcast", adminController.broadcast);

export default router;
