/*******************************************************************************
 * Copyright (c) 2009  Eucalyptus Systems, Inc.
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, only version 3 of the License.
 * 
 * 
 *  This file is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 *  for more details.
 * 
 *  You should have received a copy of the GNU General Public License along
 *  with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 *  Please contact Eucalyptus Systems, Inc., 130 Castilian
 *  Dr., Goleta, CA 93101 USA or visit <http://www.eucalyptus.com/licenses/>
 *  if you need additional information or have any questions.
 * 
 *  This file may incorporate work covered under the following copyright and
 *  permission notice:
 * 
 *    Software License Agreement (BSD License)
 * 
 *    Copyright (c) 2008, Regents of the University of California
 *    All rights reserved.
 * 
 *    Redistribution and use of this software in source and binary forms, with
 *    or without modification, are permitted provided that the following
 *    conditions are met:
 * 
 *      Redistributions of source code must retain the above copyright notice,
 *      this list of conditions and the following disclaimer.
 * 
 *      Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 * 
 *    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 *    IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 *    TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 *    PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
 *    OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *    EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 *    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 *    LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *    NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. USERS OF
 *    THIS SOFTWARE ACKNOWLEDGE THE POSSIBLE PRESENCE OF OTHER OPEN SOURCE
 *    LICENSED MATERIAL, COPYRIGHTED MATERIAL OR PATENTED MATERIAL IN THIS
 *    SOFTWARE, AND IF ANY SUCH MATERIAL IS DISCOVERED THE PARTY DISCOVERING
 *    IT MAY INFORM DR. RICH WOLSKI AT THE UNIVERSITY OF CALIFORNIA, SANTA
 *    BARBARA WHO WILL THEN ASCERTAIN THE MOST APPROPRIATE REMEDY, WHICH IN
 *    THE REGENTS’ DISCRETION MAY INCLUDE, WITHOUT LIMITATION, REPLACEMENT
 *    OF THE CODE SO IDENTIFIED, LICENSING OF THE CODE SO IDENTIFIED, OR
 *    WITHDRAWAL OF THE CODE CAPABILITY TO THE EXTENT NEEDED TO COMPLY WITH
 *    ANY SUCH LICENSES OR RIGHTS.
 *******************************************************************************
 * @author chris grzegorczyk <grze@eucalyptus.com>
 */

package com.eucalyptus.component;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import org.apache.log4j.Logger;

public class ComponentIds {
  private static Logger                        LOG       = Logger.getLogger( ComponentIds.class );
  private static final Map<Class, ComponentId> compIdMap = new HashMap<Class, ComponentId>( );
  
  public static ComponentId lookup( Class compIdClass ) {
    if ( !compIdMap.containsKey( compIdClass ) ) {
      throw new NoSuchElementException( "No ComponentId with name: " + compIdClass );
    } else {
      return compIdMap.get( compIdClass );
    }
  }
  
  /**
   * Lookup the ComponentId with name <tt>name</tt>. Note that this method is case-insensitive in
   * that the lower-case of <tt>name</tt> is compared to the l-case of ComponentId names.
   * 
   * @param name
   * @throws NoSuchElementException
   * @return
   */
  public static ComponentId lookup( String name ) {
    String realName = name.toLowerCase( );
    Map<String, ComponentId> map = Components.lookupMap( ComponentId.class );
    if ( !map.containsKey( realName ) ) {
      throw new NoSuchElementException( "No ComponentId with name: " + realName );
    } else {
      return map.get( realName );
    }
  }
  
  public static void register( ComponentId componentId ) {
    Map<String, ComponentId> map = Components.lookupMap( ComponentId.class );
    map.put( componentId.getName( ), componentId );
    compIdMap.put( componentId.getClass( ), componentId );
  }
  
  public static Object checkDeprecated( Object inst ) {
    if ( com.eucalyptus.bootstrap.Component.class.equals( inst.getClass( ) ) ) {
      LOG.error( "Deprecated usage of com.eucalyptus.bootstrap.Component for event dispatch.  Please use the corresponding ComponentId.class type." );
      String old = ( ( com.eucalyptus.bootstrap.Component ) inst ).name( );
      ComponentId compId = ComponentIds.lookup( old );
      LOG.error( "For " + old + " it is " + compId.getClass( ).getCanonicalName( ) );
      return compId;
    } else {
      return inst;
    }
  }
}
