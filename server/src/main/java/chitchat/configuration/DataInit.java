//package chitchat.configuration;
//
//import chitchat.model.User;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.data.mongodb.core.MongoTemplate;
//import org.springframework.beans.factory.annotation.Autowired;
//
//@Configuration
//public class DataInit implements CommandLineRunner {
//
//    @Autowired
//    private MongoTemplate mongoTemplate;
//
//    @Override
//    public void run(String... args) throws Exception {
//        System.out.println("Initializing data...");
//
//        // Example: Insert a sample document
//        mongoTemplate.save(User.builder()
//                        .fullName("tstst")
//                .build(), "users");
//
//        System.out.println("Data initialization complete!");
//    }
//}
