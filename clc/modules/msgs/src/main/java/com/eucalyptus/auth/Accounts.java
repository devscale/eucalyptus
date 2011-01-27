package com.eucalyptus.auth;

import java.security.cert.X509Certificate;
import java.util.List;
import org.apache.log4j.Logger;
import com.eucalyptus.auth.api.AccountProvider;
import com.eucalyptus.auth.principal.AccessKey;
import com.eucalyptus.auth.principal.Account;
import com.eucalyptus.auth.principal.Certificate;
import com.eucalyptus.auth.principal.Group;
import com.eucalyptus.auth.principal.User;

public class Accounts {
  private static final Logger LOG = Logger.getLogger( Accounts.class );
  
  private static AccountProvider accounts;
  
  public static void setAccountProvider( AccountProvider provider ) {
    synchronized ( Accounts.class ) {
      LOG.info( "Setting the account provider to: " + provider.getClass( ) );
      accounts = provider;
    }
  }
  
  public static AccountProvider getAccountProvider( ) {
    return accounts;
  }
  
  public static Account lookupAccountByName( String accountName ) throws AuthException {
    return Accounts.getAccountProvider( ).lookupAccountByName( accountName );
  }
  
  public static Account lookupAccountById( String accountId ) throws AuthException {
    return Accounts.getAccountProvider( ).lookupAccountById( accountId );
  }
  
  public static Account addAccount( String accountName ) throws AuthException {
    return Accounts.getAccountProvider( ).addAccount( accountName );
  }
  
  public static void deleteAccount( String accountName, boolean forceDeleteSystem, boolean recursive ) throws AuthException {
    Accounts.getAccountProvider( ).deleteAccount( accountName, forceDeleteSystem, recursive );
  }
  
  public static List<Account> listAllAccounts( ) throws AuthException {
    return Accounts.getAccountProvider( ).listAllAccounts( );
  }
  
  public static Account addSystemAccount( ) throws AuthException {
    return addAccount( Account.SYSTEM_ACCOUNT );
  }
  
  public static List<User> listAllUsers( ) throws AuthException {
    return Accounts.getAccountProvider( ).listAllUsers( );
  }
  
  public static boolean shareSameAccount( String userId1, String userId2 ) {
    return Accounts.getAccountProvider( ).shareSameAccount( userId1, userId2 );
  }
  
  public static User lookupUserById( String userId ) throws AuthException {
    return Accounts.getAccountProvider( ).lookupUserById( userId );
  }
  
  public static User lookupUserByAccessKeyId( String keyId ) throws AuthException {
    return Accounts.getAccountProvider( ).lookupUserByAccessKeyId( keyId );
  }
  
  public static User lookupUserByCertificate( X509Certificate cert ) throws AuthException {
    return Accounts.lookupUserByCertificate( cert );
  }
  
  public static Group lookupGroupById( String groupId ) throws AuthException {
    return Accounts.lookupGroupById( groupId );
  }
  
  public static Certificate lookupCertificate( X509Certificate cert ) throws AuthException {
    return Accounts.lookupCertificate( cert );
  }
  
  public static AccessKey lookupAccessKeyById( String keyId ) throws AuthException {
    return Accounts.lookupAccessKeyById( keyId );
  }
  
  public static User lookupSystemAdmin( ) throws AuthException {
    Account system = Accounts.lookupAccountByName( Account.SYSTEM_ACCOUNT );
    return system.lookupUserByName( User.ACCOUNT_ADMIN );
  }
  
  public static String getFirstActiveAccessKeyId( User user ) throws AuthException {
    for ( AccessKey k : user.getKeys( ) ) {
      if ( k.isActive( ) ) {
        return k.getId( );
      }
    }
    throw new AuthException( "No active access key for " + user );
  }
  
}
